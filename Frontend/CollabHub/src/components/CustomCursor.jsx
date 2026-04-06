import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Track coordinates for interpolation
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const requestRef = useRef();

  useEffect(() => {
    // Animation loop for the trailing ring
    const animateRing = () => {
      // Lerp formula (smoothly follows target): current += (target - current) * speed
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.15;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(calc(${ringPos.current.x}px - 50%), calc(${ringPos.current.y}px - 50%), 0)`;
      }
      
      requestRef.current = requestAnimationFrame(animateRing);
    };
    
    requestRef.current = requestAnimationFrame(animateRing);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      setIsVisible(true);
      
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Snap ring exactly to mouse on first move so it doesn't fly from top-left
      if (ringPos.current.x === 0 && ringPos.current.y === 0) {
        ringPos.current = { x: e.clientX, y: e.clientY };
      }
      
      // Move the solid dot instantly for zero input lag
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    const onMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('member-chip-link')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      <div 
        ref={dotRef}
        className={`cursor-dot ${isHovering ? 'hovering' : ''}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      />
      <div 
        ref={ringRef}
        className={`cursor-ring ${isHovering ? 'hovering' : ''}`}
        style={{ opacity: isVisible ? (isHovering ? 0.5 : 1) : 0 }}
      />
    </>
  );
}
