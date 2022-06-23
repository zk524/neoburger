import React, { FC, useState } from 'react';
import style from './Popover.module.css';

interface Props {
    value: string,
    className?: string,
    children: React.ReactNode
}

const Popover: FC<Props> = ({ value, className: _className, children }) => {
    const [showPopover, setShowPopover] = useState(false);
    return (
        <div className={`${_className} ${style.wrapper}`} onMouseEnter={() => setShowPopover(true)} onMouseLeave={() => setShowPopover(false)}>
            {children}
            {showPopover ? (
                <div className={style.popover}>
                    <div className={style.text}>{value}</div>
                    <div className={style.arrow} />
                </div>
            ) : null}
        </div>
    );
}

export default Popover;