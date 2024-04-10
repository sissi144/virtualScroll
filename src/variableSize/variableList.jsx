import React, { useEffect, useRef, useState } from 'react';
import { fetchData } from './helpers';
import './index.scss'
import Item from './Item';
import ExampleVariable from '.';
// 封装demo

const Variable = () => {
  const [listData, setListData] = useState([]);


  const fetchDataI = () => {
    const data = fetchData();
    let listLength = listData.length;
    const newData = data.map((item, index) => {
      return {
        ...item,
        index: listLength + index,
      };
    });
    setListData([...listData, ...newData]);
  };
  useEffect(() => {
    fetchDataI();
  }, [])


  return (
    <ExampleVariable ItemComponent={Item} onScrollEnd={fetchDataI} itemData={listData} />
  )

}
export default Variable;