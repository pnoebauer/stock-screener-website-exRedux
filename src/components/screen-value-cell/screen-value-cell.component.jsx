import React from 'react';

// const ValueCell = ( { gridColumn, gridRow, children } ) => {
//     console.log('render',gridColumn, gridRow)
//     return (
//     <div 
//         className='value-cell'
//         style={{
//             gridColumn,
//             gridRow
//         }}
//     >
//         {children.toFixed(2)}
//     </div>
// )}

class ValueCell extends React.PureComponent {

    render () {
        const { gridColumn, gridRow, children } = this.props;

        // console.log('render',gridColumn, gridRow,children)
        // console.log('render',children, typeof(children),children.toLocaleDateString())
        return (
            <div 
                className='value-cell'
                style={{
                    gridColumn,
                    gridRow
                }}
            >
                {children.toLocaleString({maximumFractionDigits:2})}
            </div>
        )
    }
}
export default ValueCell;