import React, { useEffect, useRef, useState } from 'react';
import './index.scss'

const ExampleVariable = ({ ItemComponent, onScrollEnd, itemData }) => {
  const BUFFER_SIZE = 3;
  const ESTIMATED_HEIGHT = 180; // 元素初始高度

  const [listData, setListData] = useState(itemData);// 全部数据
  const [visibleData, setVisibleData] = useState([]); //渲染的dom元素
  const scrollerRef = useRef(null); //滚动列表
  const [cachedScrollY, setCacheScrollY] = useState([]); // 保存的元素列表高度

  // 同步数据
  const scrollRefData = useRef({
    visibleCount: 0, // 可视元素数
    anchorItem: { index: 0, offset: 0 },// 锚点元素 可视区域内的第一个元素 index表示第几个 offset表示被遮盖住的部分
    firstAttachedItem: 0,// 头挂载元素
    lastAttachedItem: 0, // 尾挂载元素
    lastScrollTop: 0,// 上次滚动的距离
    cachedHeight: [],
    cacheHeight: [], //列表长度
    revising: false,
    scrollRunwayEnd: 0,// 列表总长度
  })

  const itemRefs = useRef([]); // 列表元素ref

  const syncData = scrollRefData.current;

  useEffect(() => {
    setListData(itemData)
  }, [itemData])

  // mounted
  useEffect(() => {
    syncData.visibleCount = Math.ceil(scrollerRef.current.offsetHeight / ESTIMATED_HEIGHT); //可视元素数量
    // 初始头挂载元素为0 
    syncData.lastAttachedItem = syncData.visibleCount + BUFFER_SIZE // 尾挂载元素
  }, []);

  //列表变化后总长度 可视区 发生变化 computed
  useEffect(() => {
    computeScrollRunWayEnd();
    const newVisibleData = listData.slice(syncData.firstAttachedItem, syncData.lastAttachedItem);
    setVisibleData(newVisibleData);
  }, [listData])

  // 计算长度变化
  const computeScrollRunWayEnd = () => {
    const maxScrollY = syncData.cacheHeight.reduce((sum, h) => (sum += h || ESTIMATED_HEIGHT), 0);
    const currentAverageH = maxScrollY / syncData.cacheHeight.length;
    if (isNaN(currentAverageH)) {
      syncData.scrollRunwayEnd = listData.length * ESTIMATED_HEIGHT;
    } else {
      syncData.scrollRunwayEnd = maxScrollY + (listData.length - syncData.cacheHeight.length) * currentAverageH;
    }
  }

  // 滚动处理
  // 更新顺序 锚点元素-> 头挂载元素 -> 尾挂载元素
  const handleScroll = () => {
    if (syncData.revising) return;
    const delta = scrollerRef.current.scrollTop - syncData.lastScrollTop;
    syncData.lastScrollTop = scrollerRef.current.scrollTop;
    updateAnchorItem(delta);
    updateAttachedItem();
    handleLoadMore();
  };

  const updateAttachedItem = () => {
    syncData.firstAttachedItem = Math.max(0, syncData.anchorItem.index - BUFFER_SIZE);
    syncData.lastAttachedItem = Math.min(syncData.firstAttachedItem + syncData.visibleCount + BUFFER_SIZE * 2, listData.length);
    const newVisibleData = listData.slice(syncData.firstAttachedItem, syncData.lastAttachedItem);
    setVisibleData(newVisibleData);
  }

  // 计算每一个 item 的 translateY 的高度
  const calItemScrollY = (list) => {
    // 1.找到锚点元素
    const anchorDomIndex = syncData.anchorItem.index - syncData.firstAttachedItem;// 表示在可视元素列表内的index
    const anchorDom = itemRefs.current[anchorDomIndex];

    let newCachedScrollY = [...cachedScrollY];
    if (anchorDom.current) {
      const anchorDomHeight = anchorDom.current.getBoundingClientRect().height;
      newCachedScrollY[syncData.anchorItem.index] = scrollerRef.current.scrollTop - syncData.anchorItem.offset;
      syncData.cacheHeight[syncData.anchorItem.index] = anchorDomHeight;
      for (let i = anchorDomIndex + 1; i < itemRefs.current.length; i++) {

        const curIndex = i + syncData.firstAttachedItem; // 表示在全局列表里的index
        const item = itemRefs.current[i];
        if (item.current) {
          const { height } = item.current.getBoundingClientRect();
          syncData.cacheHeight[curIndex] = height;
          const scrollY = newCachedScrollY[curIndex - 1] + syncData.cacheHeight[curIndex - 1];
          newCachedScrollY[curIndex] = scrollY;
        }
      }
      // 计算 anchorItem 前面的 item scrollY
      for (let i = anchorDomIndex - 1; i >= 0; i--) {
        const curIndex = i + syncData.firstAttachedItem; // 表示在全局列表里的index
        const item = itemRefs.current[i];
        if (item.current) {
          const { height } = item.current.getBoundingClientRect();
          newCachedScrollY[curIndex] = height;
          const scrollY = newCachedScrollY[curIndex + 1] - syncData.cacheHeight[curIndex];
          newCachedScrollY[curIndex] = scrollY;
        }

      }
      computeScrollRunWayEnd(); // 计算总长度
      setCacheScrollY(newCachedScrollY); // 计算偏移距离
      console.log(newCachedScrollY);
      // 修正拖动过快导致的滚动到顶端有空余的偏差
      if (newCachedScrollY[0] > 0) {
        console.log('revising redundant');
        syncData.revising = true;
        const delta = newCachedScrollY[0];
        const last = Math.min(syncData.lastAttachedItem, listData.length);
        for (let i = 0; i < last; i++) {
          newCachedScrollY[i] = newCachedScrollY[i] - delta;
        }
        setCacheScrollY(newCachedScrollY); // 计算偏移距离
        const scrollTop = newCachedScrollY[syncData.anchorItem.index - 1]
          ? newCachedScrollY[syncData.anchorItem.index - 1] + syncData.anchorItem.offset
          : syncData.anchorItem.offset;
        scrollerRef.current.scrollTop = scrollTop;
        syncData.lastScrollTop = scrollerRef.current.scrollTop;
        syncData.revising = false;
      }

    }
  }

  const updateAnchorItem = (delta) => {
    const lastIndex = syncData.anchorItem.index;
    const lastOffset = syncData.anchorItem.offset;
    delta += lastOffset;

    let index = lastIndex;
    // 向下滑
    if (delta >= 0) {
      // 锚点的index在列表内 并且 下滑的距离比高度大 那就要更换锚点了
      while (index < listData.length && delta > (syncData.cacheHeight[index] || ESTIMATED_HEIGHT)) {
        if (!syncData.cacheHeight[index]) {
          syncData.cacheHeight[index] = ESTIMATED_HEIGHT;
        }
        delta -= syncData.cacheHeight[index];
        index++;
      }
      // 否则 假如滑出去了 
      if (index >= listData.length) {
        // 那锚点就变为最后一个
        syncData.anchorItem = { index: listData.length - 1, offset: 0 };
      } else { // 不然就更新锚点数据
        syncData.anchorItem = { index, offset: delta };
      }
    } else {
      // 向上滑
      while (delta < 0) {
        if (!syncData.cacheHeight[index - 1]) {
          syncData.cacheHeight[index - 1] = ESTIMATED_HEIGHT
        }
        delta += syncData.cacheHeight[index - 1];
        index--;
      }
      // 滑倒头了
      if (index < 0) {
        syncData.anchorItem = { index: 0, offset: 0 };
        // 不然就更新
      } else {
        syncData.anchorItem = { index, offset: delta };
      }
    };
    // 修正拖动过快导致的滚动到顶端滚动条不足的偏差
    if (cachedScrollY[syncData.firstAttachedItem] <= -1) {
      console.log('revising insufficient');
      syncData.revising = true;
      const actualScrollY = syncData.cachedHeight.slice(0, Math.max(0, syncData.anchorItem.index)).reduce((sum, h) => (sum + h), 0);
      scrollerRef.current.scrollTop = actualScrollY + syncData.anchorItem.offset;
      syncData.lastScrollTop = scrollerRef.current.scrollTop;
      if (scrollerRef.current.scrollTop === 0) {
        syncData.anchorItem = { index: 0, offset: 0 };
      }
      calItemScrollY();
      syncData.revising = false;
    }
  }

  // 加载更多
  const handleLoadMore = () => {
    const scrollEnd = scrollerRef.current.scrollTop + scrollerRef.current.offsetHeight;
    if (scrollEnd >= syncData.scrollRunwayEnd) {
      onScrollEnd();
    }
  };
  const handleSizeChange = (index) => {
    calItemScrollY();
  };

  return (
    <ul
      ref={scrollerRef}
      className="height-dynamic"
      onScroll={handleScroll}
    >
      {/* 哨兵元素负责撑开 ul 的高度 */}
      <li
        className="height-dynamic__scroll-runway"
        style={{ transform: `translate(0, ${syncData.scrollRunwayEnd}px)` }}
      ></li>
      {
        visibleData.map((item, index) => {
          itemRefs.current[index] = React.createRef();
          return (
            <ItemComponent
              className="height-dynamic__item"
              data={item}
              ref={itemRefs.current[index]}
              index={item.index}
              key={item.username + item.phone}
              handleSizeChange={handleSizeChange}
              style={{ transform: `translate(0, ${cachedScrollY[item.index] || item.index * ESTIMATED_HEIGHT}px)` }}
            />
          )
        })
      }
    </ul>
  );
};

export default ExampleVariable;
