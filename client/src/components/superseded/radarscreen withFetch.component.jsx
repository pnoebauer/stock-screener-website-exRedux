import React from 'react';

import ScreenHeader from '../screen-header/screen-header.component';
import GenerateGrid from '../generate-grid/generate-grid.component';
import AddColumnButton from '../add-column-button/add-column-button.component';
import Dropdown from '../dropdown/dropdown.component';
import AddStockUniverseButton from '../add-stock-universe-button/add-stock-universe-button.component';

import {
	INTERVALS,
	SYMBOLS,
	API_TO_INDICATORS,
	INDICATORS_TO_API,
} from '../../assets/constants';

import './radarscreen.styles.css';

const permanentHeaders = ['ID', 'Symbol', 'Interval'];

let updateKey = null;

class RadarScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			Symbol: SYMBOLS.slice(0, 5),
			Interval: Array(5).fill(INTERVALS[0]),
			ID: [...Array(5)].map((a, idx) => idx),
			// 'Last Price': Array(8).fill(0)
		};
	}

	// Returns all the headers based on state object keys
	getHeaderTitle = () => {
		let headerTitle = Object.keys(this.state).filter(
			key => this.state[key] !== undefined
		);
		// console.log(headerTitle)
		headerTitle = headerTitle.filter(item => item !== 'ID');
		return headerTitle;
	};

	fetchAndSetState = (Symbol, header, clearedState, valueRow) => {
		const {fetchRealTimeData} = this.props;

		// map the header (= state keys) to INDICATORS_TO_API; do not include permanent headers
		const apiIndicators = header.flatMap(item =>
			permanentHeaders.includes(item) ? [] : [INDICATORS_TO_API[item]]
		);

		let stateUpdates = {};

		//fetch all symbols and apiIndicators
		fetchRealTimeData(Symbol, apiIndicators)
			.then(indicatorObject => {
				// loop over all apiIndicators
				apiIndicators.forEach(apiIndicator => {
					// look up the name used for the column header (and state key)
					const indicatorColumn = API_TO_INDICATORS[apiIndicator];

					const updatedRows =
						valueRow !== undefined
							? Object.assign([], this.state[indicatorColumn], {
									[valueRow]: indicatorObject[apiIndicator][0],
							  })
							: indicatorObject[apiIndicator];

					// merge the result of the current indicator column with the temp state object
					stateUpdates = {
						...stateUpdates,
						[indicatorColumn]: updatedRows,
					};
				});
				return stateUpdates;
			})
			.catch(e => console.log(e, 'error during fetching'))
			// update state to the updated indicators and the clearedState (all unused indicators set to null)
			.then(stateUpdates =>
				this.setState({...clearedState, ...stateUpdates}, () => {
					// console.log(stateUpdates,clearedState,'c',{...stateUpdates,...clearedState})
					// console.log(this.getHeaderTitle())
					localStorage.setItem('header', this.getHeaderTitle());
					localStorage.setItem('Symbol', this.state.Symbol);
					localStorage.setItem('Interval', this.state.Interval);
					localStorage.setItem('ID', this.state.ID);
				})
			);
	};

	componentDidMount() {
		let {Symbol, Interval, ID} = this.state;
		let rehydrate = {};
		let header;
		try {
			header = localStorage.getItem('header').split(',');
			Symbol = localStorage.getItem('Symbol').split(',');
			Interval = localStorage.getItem('Interval').split(',');
			ID = localStorage.getItem('ID').split(',');

			rehydrate = {...rehydrate, Symbol, Interval, ID};
			// console.log('rehydrate',rehydrate)
		} catch {
			header = this.getHeaderTitle();
		}

		this.setState(rehydrate, () => {
			// console.log('mount h', header)
			this.fetchAndSetState(Symbol, header);
		});

		/* FETCH BACKEND TEST */

		// {
		// 	"symbol": "MMM",
		// 	"interval": "Day",
		// 	"indicators": {
		// 		"sma": {
		// 			"parameter": "close_price",
		// 			"lookBack": "90"
		// 		},
		// 		"ema": {
		// 			"parameter": "open_price",
		// 			"lookBack": "210"
		// 		}
		// 	}
		// }
		const requestObj = {
			symbol: 'MMM',
			interval: 'Day',
			indicators: {
				sma: {
					parameter: 'close_price',
					lookBack: 90,
				},
				ema: {
					parameter: 'open_price',
					lookBack: 210,
				},
			},
		};
		fetch('http://localhost:4000/scanner', {
			method: 'POST', // *GET, POST, PUT, DELETE, etc.
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestObj), // body data type must match "Content-Type" header
		})
			.then(res => res.json())
			.then(data => console.log(data, 'data'))
			.catch(e => console.log(e, 'e'));

		// fetch('http://localhost:4000')
		// 	.then(res => res.json())
		// 	// .then(res => console.log(res, 'res'))
		// 	.then(data => console.log(data, 'data', JSON.stringify(requestObj)))
		// 	.catch(e => console.log(e, 'error'));
	}

	//used for dropdowns - updates one row
	onChange = (updatedValue, headerCol, valueRow, rowAdded) => {
		const header = this.getHeaderTitle();

		//update the changed cell (Symbol, Interval)
		this.setState(
			prevState => {
				const columnName = header[headerCol]; //which column changed (Symbol, Interval)
				// console.log(prevState.ID,'prevState.ID')
				const maxID = Math.max(...prevState.ID);
				return {
					[columnName]: Object.assign([], prevState[columnName], {
						[valueRow]: updatedValue,
					}),
					Interval: rowAdded
						? Object.assign([], prevState.Interval, {[valueRow]: 'Daily'})
						: prevState.Interval,
					ID: rowAdded
						? Object.assign([], prevState.ID, {[valueRow]: maxID + 1})
						: prevState.ID,
				};
			},
			//fetch the data for the entire row based on Symbol, Interval
			() => {
				const Symbol = new Array(this.state.Symbol[valueRow]);
				this.fetchAndSetState(Symbol, header, {}, valueRow);
			}
		);
	};

	sortTable = event => {
		this.setState((prevState, props) => {
			const sortedTable = props.onSort(event, prevState);
			return sortedTable;
		});
	};

	handleColumnUpdate = names => {
		const {Symbol} = this.state;
		// merge permanentHeaders with the updated column names
		const header = [...permanentHeaders, ...names];

		const clearedState = JSON.parse(JSON.stringify(this.state));

		Object.keys(clearedState).forEach(key => {
			if (!header.includes(key)) {
				clearedState[key] = undefined;
			}
		});

		// console.log(clearedState,'cl')

		this.fetchAndSetState(Symbol, header, clearedState);
	};

	handleRowDelete = e => {
		const rowIdx = Number(e.target.id);
		const stateClone = JSON.parse(JSON.stringify(this.state));

		// console.log(stateClone, rowIdx)

		Object.keys(stateClone).forEach(key => {
			stateClone[key].splice(rowIdx, 1);
		});

		this.setState(stateClone, () => {
			localStorage.setItem('header', this.getHeaderTitle());
			localStorage.setItem('Symbol', this.state.Symbol);
			localStorage.setItem('Interval', this.state.Interval);
			localStorage.setItem('ID', this.state.ID);
		});
	};

	handleDeleteAllRows = e => {
		Object.keys(this.state).forEach(key => {
			this.setState({[key]: []});
		});
	};

	onRowAdd = (updatedValue, headerCol, valueRow) =>
		this.onChange(updatedValue, headerCol, valueRow, true);

	handleUniverseAdd = symbols => {
		const numberAddedSymbols = symbols.length;

		const stateClone = JSON.parse(JSON.stringify(this.state));
		const maxID = Math.max(...stateClone.ID, 0);
		// console.log(maxID, 'maxID');

		stateClone.Symbol = [...stateClone.Symbol, ...symbols];
		stateClone.Interval = [
			...stateClone.Interval,
			...Array(numberAddedSymbols).fill(INTERVALS[0]),
		];
		stateClone.ID = [
			...stateClone.ID,
			...[...Array(numberAddedSymbols)].map((a, idx) => idx + maxID + 1),
		];

		const header = this.getHeaderTitle();

		this.fetchAndSetState(stateClone.Symbol, header, stateClone);
	};

	render() {
		const header = this.getHeaderTitle();
		// passed from the withSort HOC
		const {sortConfig} = this.props;
		const {Symbol} = this.state;

		const usedIndicators = header.flatMap(item =>
			permanentHeaders.includes(item) ? [] : [item]
		);

		updateKey = header;

		return (
			<div className='radarscreen'>
				<div
					id='grid-container'
					style={{
						gridTemplateColumns: `20px repeat(${header.length}, 1fr) 0`,
						gridTemplateRows: `repeat(${Symbol.length + 1}, 1fr) 0`,
					}}
				>
					<ScreenHeader
						header={header}
						sortTable={this.sortTable}
						sortConfig={sortConfig}
					/>
					<AddColumnButton
						style={{
							gridColumn: `${header.length + 2}`,
						}}
						handleColumnUpdate={this.handleColumnUpdate}
						usedIndicatorsDefault={usedIndicators}
						key={updateKey}
					/>
					<GenerateGrid
						{...this.state}
						header={header}
						onChange={this.onChange}
						handleRowDelete={this.handleRowDelete}
					/>

					<Dropdown
						options={SYMBOLS}
						gridRow={Symbol.length + 2}
						gridColumn={1}
						// key={colIdx.toString()+rowIdx.toString()}
						onChange={this.onRowAdd}
						customStyles={{
							height: '30px',
							borderBottom: '1px solid black',
							borderLeft: '1px solid black',
							marginLeft: '-1px',
						}}
						className={'add-row'}
					>
						{SYMBOLS[Symbol.length]}
					</Dropdown>

					<AddStockUniverseButton
						style={{
							gridColumn: '1',
							gridRow: '1',
						}}
						handleUniverseAdd={this.handleUniverseAdd}
					/>

					<button
						style={{
							border: 'none',
							gridColumn: '1',
							gridRow: `${Symbol.length} + 2`,
							height: '31px',
							borderBottom: '1px solid black',
							borderLeft: '1px solid black',
							borderTop: '1px solid black',
							marginLeft: '-1px',
						}}
						onClick={this.handleDeleteAllRows}
					>
						XX
					</button>
				</div>
			</div>
		);
	}
}

export default RadarScreen;
