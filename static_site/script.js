(function () {
    const isMag = () => document.body && document.body.classList.contains('theme-mag');

    const rafThrottle = (fn) => {
        let rafId = 0;
        return (...args) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                fn(...args);
            });
        };
    };

    const ensureMagShell = () => {
        if (!isMag()) return;
        if (document.querySelector('.mag-shell')) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'magCosmos';
        canvas.setAttribute('aria-hidden', 'true');

        const glow = document.createElement('div');
        glow.className = 'mag-glow';
        glow.setAttribute('aria-hidden', 'true');

        const grain = document.createElement('div');
        grain.className = 'mag-grain';
        grain.setAttribute('aria-hidden', 'true');

        const shell = document.createElement('div');
        shell.className = 'mag-shell';

        const stage = document.createElement('div');
        stage.className = 'mag-stage';

        const nodes = Array.from(document.body.childNodes);
        nodes.forEach((n) => {
            if (n === canvas || n === glow || n === grain) return;
            stage.appendChild(n);
        });

        shell.appendChild(canvas);
        shell.appendChild(glow);
        shell.appendChild(grain);
        shell.appendChild(stage);
        document.body.appendChild(shell);
    };

    const initHeader = () => {
        const header = document.querySelector('header');
        if (!header) return;
        const onScroll = rafThrottle(() => {
            header.classList.toggle('is-scrolled', window.scrollY > 12);
        });
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    };

    const initBackTop = () => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isMag() ? 'mag-btn mag-backtop' : '';
        btn.textContent = '↑';
        if (!isMag()) {
            btn.style.position = 'fixed';
            btn.style.bottom = '30px';
            btn.style.right = '30px';
            btn.style.width = '50px';
            btn.style.height = '50px';
            btn.style.borderRadius = '50%';
            btn.style.backgroundColor = '#4a90e2';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.fontSize = '24px';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
            btn.style.opacity = '0';
            btn.style.transition = 'opacity 0.3s ease';
            btn.style.zIndex = '1000';
        }
        document.body.appendChild(btn);

        const update = rafThrottle(() => {
            const visible = window.scrollY > 320;
            if (isMag()) {
                btn.classList.toggle('is-visible', visible);
            } else {
                btn.style.opacity = visible ? '1' : '0';
            }
        });

        window.addEventListener('scroll', update, { passive: true });
        update();

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };

    const initCosmos = () => {
        if (!isMag()) return;
        const canvas = document.getElementById('magCosmos');
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        let w = 0;
        let h = 0;
        let stars = [];
        let t0 = performance.now();

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            w = Math.max(1, Math.floor(rect.width));
            h = Math.max(1, Math.floor(rect.height));
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const count = Math.round(Math.min(240, Math.max(120, (w * h) / 9000)));
            stars = new Array(count).fill(0).map(() => {
                const z = Math.random();
                const speed = 0.02 + z * 0.05;
                const r = 0.45 + z * 1.2;
                const alpha = 0.12 + z * 0.55;
                return {
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r,
                    alpha,
                    tw: Math.random() * 6 + 2,
                    ph: Math.random() * Math.PI * 2,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed,
                    hue: 190 + Math.random() * 90,
                };
            });
        };

        const draw = (now) => {
            const dt = Math.min(50, now - t0);
            t0 = now;
            const t = now / 1000;

            ctx.clearRect(0, 0, w, h);

            const cx = w * 0.5;
            const cy = h * 0.38;
            const pulse = 0.52 + 0.48 * Math.sin(t * 0.35);

            const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.62);
            g1.addColorStop(0, `rgba(255,255,255,${0.06 + pulse * 0.03})`);
            g1.addColorStop(0.22, `rgba(175,243,255,${0.04 + pulse * 0.03})`);
            g1.addColorStop(0.5, `rgba(219,197,255,${0.03 + pulse * 0.02})`);
            g1.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g1;
            ctx.fillRect(0, 0, w, h);

            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                if (s.x < -20) s.x = w + 20;
                if (s.x > w + 20) s.x = -20;
                if (s.y < -20) s.y = h + 20;
                if (s.y > h + 20) s.y = -20;

                const tw = 0.72 + 0.28 * Math.sin(t * s.tw + s.ph);
                const a = s.alpha * tw;
                ctx.fillStyle = `hsla(${s.hue}, 90%, 90%, ${a})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(draw);
        };

        const onResize = rafThrottle(() => resize());
        window.addEventListener('resize', onResize, { passive: true });
        resize();
        requestAnimationFrame(draw);
    };

    const initCursor = () => {
        if (!isMag()) return;
        if (document.querySelector('.mag-cursor')) return;
        const blob = document.createElement('div');
        blob.className = 'mag-cursor';
        blob.setAttribute('aria-hidden', 'true');
        document.body.appendChild(blob);

        let tx = window.innerWidth * 0.5;
        let ty = window.innerHeight * 0.5;
        let x = tx;
        let y = ty;
        let shown = false;

        const step = () => {
            x += (tx - x) * 0.11;
            y += (ty - y) * 0.11;
            blob.style.left = `${x}px`;
            blob.style.top = `${y}px`;
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);

        const move = rafThrottle((ev) => {
            if (!shown) {
                shown = true;
                blob.style.opacity = '1';
            }
            tx = ev.clientX;
            ty = ev.clientY;
        });

        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener(
            'pointerleave',
            () => {
                blob.style.opacity = '0';
                shown = false;
            },
            { passive: true }
        );
    };

    const initRipples = () => {
        const add = (x, y) => {
            if (!isMag()) return;
            const r = document.createElement('div');
            r.className = 'mag-ripple';
            r.style.left = `${x}px`;
            r.style.top = `${y}px`;
            document.body.appendChild(r);
            r.addEventListener('animationend', () => r.remove(), { once: true });
        };

        window.addEventListener(
            'pointerdown',
            (ev) => {
                add(ev.clientX, ev.clientY);
            },
            { passive: true }
        );
    };

    const initSpringPress = () => {
        const canAnimate = (el) => {
            if (!el) return false;
            if (!isMag()) return false;
            if (el.closest('a, button')) return true;
            return el.classList.contains('mag-card') || el.classList.contains('mag-panel');
        };

        const press = (target) => {
            if (!canAnimate(target)) return;
            target.animate(
                [
                    { transform: 'translateY(0) scale(1)', offset: 0 },
                    { transform: 'translateY(1px) scale(0.98)', offset: 1 },
                ],
                { duration: 140, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
            );
        };

        const release = (target) => {
            if (!canAnimate(target)) return;
            target.animate(
                [
                    { transform: 'translateY(1px) scale(0.98)', offset: 0 },
                    { transform: 'translateY(-1px) scale(1.02)', offset: 0.55 },
                    { transform: 'translateY(0) scale(1)', offset: 1 },
                ],
                { duration: 520, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)', fill: 'forwards' }
            );
        };

        window.addEventListener(
            'pointerdown',
            (ev) => {
                const t = ev.target;
                if (!(t instanceof Element)) return;
                const target = t.closest('a, button, .mag-card, .mag-panel');
                if (!target) return;
                press(target);
            },
            { passive: true }
        );

        window.addEventListener(
            'pointerup',
            (ev) => {
                const t = ev.target;
                if (!(t instanceof Element)) return;
                const target = t.closest('a, button, .mag-card, .mag-panel');
                if (!target) return;
                release(target);
            },
            { passive: true }
        );
    };

    const initLegacyScrollReveal = () => {
        const animateOnScroll = () => {
            const introElements = document.querySelectorAll('.intro-content');
            introElements.forEach((element) => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.3;
                if (elementPosition < screenPosition) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            });

            const gallerySection = document.querySelector('.gallery-section');
            if (gallerySection) {
                const galleryItems = gallerySection.querySelectorAll('.photo-item');
                galleryItems.forEach((item, index) => {
                    const itemPosition = item.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.2;
                    if (itemPosition < screenPosition) {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                        item.style.transitionDelay = `${index * 0.1}s`;
                    }
                });
            }

            const recruitmentSection = document.querySelector('.recruitment-section');
            if (recruitmentSection) {
                const recruitmentElements = recruitmentSection.querySelectorAll('.recruitment-content');
                recruitmentElements.forEach((element) => {
                    const elementPosition = element.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.3;
                    if (elementPosition < screenPosition) {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }
                });
            }

            const contactSection = document.querySelector('.contact-section');
            if (contactSection) {
                const contactElements = contactSection.querySelectorAll('.contact-info, .contact-qrcode');
                contactElements.forEach((element, index) => {
                    const elementPosition = element.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.3;
                    if (elementPosition < screenPosition) {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                        element.style.transitionDelay = `${index * 0.2}s`;
                    }
                });
            }
        };

        window.addEventListener('load', () => {
            const introElements = document.querySelectorAll('.intro-content');
            introElements.forEach((element) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            });

            const gallerySection = document.querySelector('.gallery-section');
            if (gallerySection) {
                const galleryItems = gallerySection.querySelectorAll('.photo-item');
                galleryItems.forEach((item) => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                });
            }

            const recruitmentSection = document.querySelector('.recruitment-section');
            if (recruitmentSection) {
                const recruitmentElements = recruitmentSection.querySelectorAll('.recruitment-content');
                recruitmentElements.forEach((element) => {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(30px)';
                    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                });
            }

            const contactSection = document.querySelector('.contact-section');
            if (contactSection) {
                const contactElements = contactSection.querySelectorAll('.contact-info, .contact-qrcode');
                contactElements.forEach((element) => {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(30px)';
                    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                });
            }

            animateOnScroll();
        });

        window.addEventListener('scroll', animateOnScroll, { passive: true });
    };

    const initVideoFullscreen = () => {
        const promoVideo = document.getElementById('promoVideo');
        const videoContainer = document.querySelector('.video-container');
        if (!promoVideo || !videoContainer) return;
        videoContainer.addEventListener('click', () => {
            if (promoVideo.requestFullscreen) {
                promoVideo.requestFullscreen();
            } else if (promoVideo.webkitRequestFullscreen) {
                promoVideo.webkitRequestFullscreen();
            } else if (promoVideo.msRequestFullscreen) {
                promoVideo.msRequestFullscreen();
            }
        });
    };

    const initDeckAnchors = () => {
        if (!isMag()) return;
        const deck = document.querySelector('.mag-deck');
        if (!deck) return;

        const getHash = (href) => {
            if (!href) return '';
            const idx = href.indexOf('#');
            if (idx === -1) return '';
            return href.slice(idx);
        };

        const scrollToHash = (hash) => {
            if (!hash || hash === '#') return;
            const id = hash.replace('#', '');
            const el = document.getElementById(id);
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        deck.addEventListener('click', (ev) => {
            const t = ev.target;
            if (!(t instanceof Element)) return;
            const a = t.closest('a');
            if (!a) return;
            if (!a.classList.contains('mag-toc-link')) return;
            const hash = getHash(a.getAttribute('href') || '');
            if (!hash) return;
            ev.preventDefault();
            history.replaceState(null, '', hash);
            scrollToHash(hash);
        });

        if (location.hash) {
            setTimeout(() => scrollToHash(location.hash), 120);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (isMag()) ensureMagShell();
        initHeader();
        initBackTop();
        initVideoFullscreen();

        if (isMag()) {
            initCosmos();
            initCursor();
            initRipples();
            initSpringPress();
            initDeckAnchors();
        } else {
            initLegacyScrollReveal();
        }
    });
})();
