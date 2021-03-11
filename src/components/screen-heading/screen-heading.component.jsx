import React from 'react';

const ScreenHeader = ( { gridColumn, onSort, id, children } ) => (

    <div 
        className='screen-header'
        style={{gridColumn}}
        onClick={e=>onSort(e)}
        id={id}
    >
        {children}
    </div>
)

export default ScreenHeader;