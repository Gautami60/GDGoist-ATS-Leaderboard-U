import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Page Reveal Animation - Runs once on page load
 * Creates a smooth fade + upward motion effect
 */
export function usePageReveal(containerRef, options = {}) {
    const { delay = 0.1, duration = 0.8 } = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Set initial state
        gsap.set(container, {
            opacity: 0,
            y: 30
        });

        // Animate in
        gsap.to(container, {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: 'power2.out'
        });
    }, [containerRef, delay, duration]);
}

/**
 * Scroll-Triggered Section Reveal
 * Animates sections as they enter the viewport
 */
export function useScrollReveal(sectionRef, options = {}) {
    const {
        y = 40,
        duration = 0.7,
        stagger = 0.1,
        triggerStart = 'top 85%',
        childSelector = null
    } = options;

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const elements = childSelector
            ? section.querySelectorAll(childSelector)
            : [section];

        gsap.set(elements, {
            opacity: 0,
            y
        });

        const animation = gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: section,
                start: triggerStart,
                toggleActions: 'play none none none'
            }
        });

        return () => {
            animation.kill();
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.trigger === section) {
                    trigger.kill();
                }
            });
        };
    }, [sectionRef, y, duration, stagger, triggerStart, childSelector]);
}

/**
 * Text Stagger Animation for Headings
 * Animates text word by word or line by line
 */
export function useTextStagger(textRef, options = {}) {
    const {
        type = 'words', // 'words' | 'chars' | 'lines'
        duration = 0.6,
        stagger = 0.05,
        y = 20
    } = options;

    useEffect(() => {
        const element = textRef.current;
        if (!element) return;

        const originalText = element.textContent;
        let splitElements = [];

        if (type === 'words') {
            const words = originalText.split(' ');
            element.innerHTML = words
                .map(word => `<span class="gsap-word" style="display: inline-block; overflow: hidden;"><span class="gsap-word-inner" style="display: inline-block;">${word}</span></span>`)
                .join(' ');
            splitElements = element.querySelectorAll('.gsap-word-inner');
        } else if (type === 'chars') {
            const chars = originalText.split('');
            element.innerHTML = chars
                .map(char => char === ' ' ? ' ' : `<span class="gsap-char" style="display: inline-block;">${char}</span>`)
                .join('');
            splitElements = element.querySelectorAll('.gsap-char');
        }

        gsap.set(splitElements, {
            opacity: 0,
            y
        });

        const animation = gsap.to(splitElements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });

        return () => {
            animation.kill();
            element.textContent = originalText;
        };
    }, [textRef, type, duration, stagger, y]);
}

/**
 * Magnetic Hover Effect for Buttons
 * Creates a subtle cursor pull effect on hover
 */
export function useMagneticHover(elementRef, options = {}) {
    const { strength = 0.3, maxMovement = 6 } = options;
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleMouseMove = (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) * strength;
            const deltaY = (e.clientY - centerY) * strength;

            const x = Math.max(-maxMovement, Math.min(maxMovement, deltaX));
            const y = Math.max(-maxMovement, Math.min(maxMovement, deltaY));

            positionRef.current = { x, y };

            gsap.to(element, {
                x,
                y,
                duration: 0.3,
                ease: 'power2.out'
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)'
            });
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [elementRef, strength, maxMovement]);
}

/**
 * Subtle Parallax Effect
 * Creates depth with background/image shifts on scroll
 */
export function useParallax(elementRef, options = {}) {
    const { speed = 0.2, direction = 'y' } = options;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const animation = gsap.to(element, {
            [direction]: () => window.innerHeight * speed * -1,
            ease: 'none',
            scrollTrigger: {
                trigger: element,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });

        return () => {
            animation.kill();
        };
    }, [elementRef, speed, direction]);
}

/**
 * Combined Landing Page Animations
 * All-in-one hook for landing page
 */
export function useLandingAnimations() {
    useEffect(() => {
        // Page reveal for hero section
        const heroElements = document.querySelectorAll('.hero-animate');
        gsap.set(heroElements, { opacity: 0, y: 30 });
        gsap.to(heroElements, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 0.2
        });

        // Scroll reveal for sections
        const sections = document.querySelectorAll('.section-animate');
        sections.forEach(section => {
            const children = section.querySelectorAll('.item-animate');

            gsap.set(children.length > 0 ? children : section, {
                opacity: 0,
                y: 40
            });

            gsap.to(children.length > 0 ? children : section, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            });
        });

        // Magnetic buttons
        const magneticBtns = document.querySelectorAll('.magnetic-btn');
        magneticBtns.forEach(btn => {
            const strength = 0.3;
            const maxMovement = 6;

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const deltaX = (e.clientX - centerX) * strength;
                const deltaY = (e.clientY - centerY) * strength;

                const x = Math.max(-maxMovement, Math.min(maxMovement, deltaX));
                const y = Math.max(-maxMovement, Math.min(maxMovement, deltaY));

                gsap.to(btn, {
                    x,
                    y,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });

        // Cleanup
        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);
}

export { gsap, ScrollTrigger };
