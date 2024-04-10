import React, { useRef, useEffect, useState } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import faker from 'faker';
import './item.scss';


const Item = ({ index, data, fixedHeight = true, style, className }) => {
  const [defferImgSrc, setDefferImgSrc] = useState('');
  const itemRef = useRef(null);

  useEffect(() => {
    if (data.img.isDeffer) {
      setDefferImgSrc(data.img.src);
    } else {
      setTimeout(() => {
        setDefferImgSrc(data.img.src);
        data.img.isDeffer = true;
      }, faker.random.number({ min: 300, max: 5000 }));
    }
  }, [data]);

  useEffect(() => {
    if (fixedHeight) return;

    const ro = new ResizeObserver(entries => {
      // 在高度变化时，执行适当的操作，例如通知父组件
    });

    ro.observe(itemRef.current);
    return () => ro.disconnect();
  }, [fixedHeight, index]);

  return (
    <li className={`item ${className}`} ref={itemRef} style={style}>
      <div className={`item__wrapper ${fixedHeight ? 'is-fixed' : ''}`}>
        <div className="item__info">
          <img src={data.avatar} className="item__avatar" />
          <p className="item__name">{`${index}.${data.name}`}</p>
          <p className="item__date">{`${data.dob}`}</p>
        </div>
        {fixedHeight ? (
          <>
            <p className="item__text">{`E-mail: ${data.email}`}</p>
            <p className="item__text">{`Phone: ${data.phone}`}</p>
            <p className="item__text">{`City: ${data.address.city}`}</p>
            <p className="item__text">{`Street: ${data.address.street}`}</p>
          </>
        ) : (
          <>
            <p className="item__paragraph">{data.paragraph}</p>
            <img src={defferImgSrc} style={{ width: data.img.width }} className="item__img" />
            <img src={data.img.src} style={{ width: data.img.width }} className="item__img" />
          </>
        )}
      </div>
    </li>
  );
};

export default Item;