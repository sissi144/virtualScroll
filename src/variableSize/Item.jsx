import React, { useEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import './item.scss';


const Item = React.forwardRef(({ index, data, style, className, handleSizeChange }, ref) => {
  // 元素高度不固定 则需要带上这个函数
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      handleSizeChange()
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [index]);

  return (
    <li className={`item ${className}`} ref={ref} style={style}>
      <div className={`item__wrapper  `}>
        <div className="item__info">
          <img src={data?.avatar} className="item__avatar" />
          <p className="item__name">{`${index}.${data?.name}`}</p>
          <p className="item__date">{`${data?.dob}`}</p>
        </div>
        <>
          <p className="item__paragraph">{data.paragraph}</p>
          <img src={data.img?.src} style={{ width: data.img?.width }} className="item__img" />
        </>
      </div>
    </li>
  );
});

export default Item;