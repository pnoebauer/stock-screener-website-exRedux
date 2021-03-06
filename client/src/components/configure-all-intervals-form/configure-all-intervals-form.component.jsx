import React from 'react';

import {INTERVALS} from '../../assets/constants';

import './configure-all-intervals-form.styles.css';

class IntervalConfigurationForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {Interval: INTERVALS[0]};
	}

	selectionChange = event => {
		this.setState({Interval: event.target.value});
	};

	handleSubmit = event => {
		const {Interval} = this.state;

		this.props.setAllIntervals(Interval);

		this.props.closeForm();

		event.preventDefault();
	};

	render() {
		// console.log(this.state, 's');

		return (
			<form onSubmit={this.handleSubmit} className='configure-all-intervals-form'>
				<label>
					Select interval for all symbols:
					<p>
						<select
							value={this.state.Interval}
							onChange={this.selectionChange}
							name='selector'
							className='interval-type-selector'
						>
							{INTERVALS.map((value, index) => (
								// console.log( value, 'v') ||
								<option value={value} key={index}>
									{value}
								</option>
							))}
						</select>
					</p>
				</label>

				<p>
					<input
						type='submit'
						value='Apply'
						className='interval-configuration-submit-button'
					/>
				</p>
			</form>
		);
	}
}

export default IntervalConfigurationForm;
