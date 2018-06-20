import React from 'react';

import './loader.c.scss'
import loadingImg from '../../../images/centrality.png'

const Loader = () => (
    <div className='loader'>
      <div>
        <div><img src={loadingImg}/></div>
        <div className="title">Centrality</div>
      </div>
    </div>
  )

export default Loader;