import React, { useEffect, useRef, useState } from 'react';
import { fetchData } from '../variableSize/helpers';
import Item from '../variableSize/Item';
import './index.scss'

const ExampleFixed = () => {
  const BUFFER_SIZE = 3;
  const FIXED_HEIGHT = 180; // 元素初始高度

  const [listData, setListData] = useState([]);// 全部数据
  const [visibleData, setVisibleData] = useState([]); //渲染的dom元素
  const scrollerRef = useRef(null); //滚动列表
  // 同步数据
  const scrollRefData = useRef({
    firstAttachedItem: 0,// 头挂载元素
    lastAttachedItem: 0, // 尾挂载元素
    lastScrollTop: 0,// 上次滚动的距离
    listHeight: 0, // 列表总长度
    anchorItem: { index: 0, offset: 0 },// 锚点元素 可视区域内的第一个元素 index表示第几个 offset表示被遮盖住的部分
    visibleCount: 0, // 可视元素数
  })

  const syncData = scrollRefData.current;

  useEffect(() => {
    syncData.visibleCount = Math.ceil(scrollerRef.current.offsetHeight / FIXED_HEIGHT); //可视元素数量
    // 初始头挂载元素为0 
    syncData.lastAttachedItem = syncData.visibleCount + BUFFER_SIZE // 尾挂载元素
    fetchDataI();

  }, []);


  // 
  useEffect(() => {
    const newVisibleData = listData.slice(syncData.firstAttachedItem, syncData.lastAttachedItem);
    setVisibleData(newVisibleData);
  }, [listData, syncData])

  //列表变化后总长度发生变化
  useEffect(() => {
    syncData.listHeight = listData.length * FIXED_HEIGHT;
  }, [listData, syncData])

  // 加载更多元素
  const fetchDataI = () => {
    setListData([...listData, ...calItemScrollY(fetchData())]);
  };

  // 计算每一个 item 的 translateY 的高度
  const calItemScrollY = (list) => {
    let latestIndex = listData.length;
    for (let i = 0; i < list.length; i++, latestIndex++) {
      const item = list[i];
      item.scrollY = syncData.listHeight + i * FIXED_HEIGHT;// 每个元素的scrollY是固定的，
      item.index = latestIndex;
      Object.freeze(item);
    }
    return list;
  }

  // 滚动处理
  // 更新顺序 锚点元素-> 头挂载元素 -> 尾挂载元素
  const handleScroll = () => {

    const delta = scrollerRef.current.scrollTop - syncData.lastScrollTop; // 得到滚动距离
    syncData.lastScrollTop = scrollerRef.current.scrollTop; // 记录上次滚动的终点
    syncData.anchorItem.offset = syncData.anchorItem.offset + delta

    const isPositive = delta >= 0;
    if (isPositive) {
      if (syncData.anchorItem.offset >= FIXED_HEIGHT) {
        updateAnchorItem();
      }
      if (syncData.anchorItem.index - syncData.firstAttachedItem >= BUFFER_SIZE) {
        syncData.firstAttachedItem = Math.min(listData.length - syncData.visibleCount, syncData.anchorItem.index - BUFFER_SIZE)
      }
    } else {
      if (scrollerRef.current.scrollTop <= 0) {
        syncData.anchorItem = { index: 0, offset: 0 };
      } else if (syncData.anchorItem.offset < 0) {
        updateAnchorItem();
      }
      if (syncData.anchorItem.index - syncData.firstAttachedItem < BUFFER_SIZE) {
        syncData.firstAttachedItem = (Math.max(0, syncData.anchorItem.index - BUFFER_SIZE));
      }
    }
    syncData.lastAttachedItem = Math.min(syncData.firstAttachedItem + syncData.visibleCount + BUFFER_SIZE * 2, listData.length);
    setVisibleData(listData.slice(syncData.firstAttachedItem, syncData.lastAttachedItem));

    handleLoadMore();
  };

  const updateAnchorItem = () => {
    const index = Math.floor(scrollerRef.current.scrollTop / FIXED_HEIGHT);
    const offset = scrollerRef.current.scrollTop - index * FIXED_HEIGHT;
    syncData.anchorItem = { index, offset }
  };

  // 加载更多
  const handleLoadMore = () => {
    const scrollEnd = scrollerRef.current.scrollTop + scrollerRef.current.offsetHeight;
    scrollEnd >= syncData.listHeight && fetchDataI();
  };

  return (
    <ul
      ref={scrollerRef}
      className="height-fixed"
      onScroll={handleScroll}
    >
      {/* 哨兵元素负责撑开 ul 的高度 */}
      <li
        className="height-fixed__scroll-runway"
        style={{ transform: `translate(0, ${syncData.listHeight}px)` }}
      ></li>
      {
        visibleData.map((item) => (
          <Item
            className="height-fixed__item"
            data={item}
            index={item.index}
            key={item.username + item.phone}
            style={{ transform: `translate(0, ${item.scrollY}px)` }}
          />
        ))
      }


    </ul>
  );
};

export default ExampleFixed;
