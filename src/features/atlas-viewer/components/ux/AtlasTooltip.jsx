import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function AtlasTooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 200,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    // Default to top center
    let top = rect.top - 8; // 8px spacing
    let left = rect.left + rect.width / 2;

    if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - 8;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + 8;
    } else if (position === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  // Use React.cloneElement if children is a valid React element, otherwise wrap in a div
  const triggerElement = React.isValidElement(children) 
    ? React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e) => {
          if (children.props.onMouseEnter) children.props.onMouseEnter(e);
          handleMouseEnter();
        },
        onMouseLeave: (e) => {
          if (children.props.onMouseLeave) children.props.onMouseLeave(e);
          handleMouseLeave();
        },
        onFocus: (e) => {
          if (children.props.onFocus) children.props.onFocus(e);
          handleMouseEnter();
        },
        onBlur: (e) => {
          if (children.props.onBlur) children.props.onBlur(e);
          handleMouseLeave();
        }
      })
    : (
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
    );

  const tooltipElement = isVisible && typeof window !== 'undefined' ? createPortal(
    <div 
      className={`fixed z-[99999] pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95 ${className}`}
      style={{
        top: coords.top,
        left: coords.left,
        transform: position === 'top' || position === 'bottom' 
          ? `translate(-50%, ${position === 'top' ? '-100%' : '0'})` 
          : `translate(${position === 'left' ? '-100%' : '0'}, -50%)`,
      }}
    >
      {typeof content === 'string' ? (
        <div className="bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] whitespace-nowrap">
          {content}
        </div>
      ) : (
        content
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {triggerElement}
      {tooltipElement}
    </>
  );
}
