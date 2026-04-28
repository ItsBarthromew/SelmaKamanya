document.addEventListener("DOMContentLoaded", () => {
	const setupPageTransitions = () => {
		const internalLinks = document.querySelectorAll("a[href]");

		internalLinks.forEach((link) => {
			link.addEventListener("click", (event) => {
				if (
					event.defaultPrevented ||
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey
				) {
					return;
				}

				if (link.target === "_blank" || link.hasAttribute("download")) {
					return;
				}

				const href = link.getAttribute("href");
				if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
					return;
				}

				let destination;
				try {
					destination = new URL(link.href, window.location.href);
				} catch {
					return;
				}

				if (destination.origin !== window.location.origin) {
					return;
				}

				if (destination.pathname === window.location.pathname && destination.hash) {
					return;
				}

				if (destination.href === window.location.href) {
					return;
				}

				event.preventDefault();
				document.body.classList.add("page-is-leaving");
				window.setTimeout(() => {
					window.location.assign(destination.href);
				}, 220);
			});
		});

		window.addEventListener("pageshow", () => {
			document.body.classList.remove("page-is-leaving");
		});
	};

	const setupHomeIntro = () => {
		if (!document.body.classList.contains("home-page")) {
			return;
		}

		const intro = document.querySelector(".home-intro");
		const introLogoWrap = document.querySelector(".home-intro__logo-wrap");
		const introLogo = document.querySelector(".home-intro__logo");
		const targetLogo = document.querySelector(".hero-logo img");

		if (!intro || !introLogoWrap || !introLogo || !targetLogo) {
			document.body.classList.remove("home-loading");
			return;
		}

		const run = () => {
			const targetRect = targetLogo.getBoundingClientRect();
			const startX = window.innerWidth / 2;
			const startY = window.innerHeight / 2;
			const targetX = targetRect.left + targetRect.width / 2;
			const targetY = targetRect.top + targetRect.height / 2;

			const dx = targetX - startX;
			const dy = targetY - startY;
			const introWidth = introLogo.getBoundingClientRect().width || 84;
			const scale = targetRect.width / introWidth;

			introLogoWrap.style.setProperty("--intro-dx", `${dx}px`);
			introLogoWrap.style.setProperty("--intro-dy", `${dy}px`);
			introLogoWrap.style.setProperty("--intro-scale", `${scale}`);

			window.requestAnimationFrame(() => {
				document.body.classList.remove("home-loading");
				intro.classList.add("is-animating");
			});

			window.setTimeout(() => {
				intro.remove();
			}, 980);
		};

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			document.body.classList.remove("home-loading");
			intro.remove();
			return;
		}

		window.setTimeout(run, 120);
	};

	const setupHomeHorizontalCarousel = () => {
		if (!document.body.classList.contains("home-page")) {
			return;
		}

		const scroller = document.querySelector(".home-horizontal__sticky");
		const items = document.querySelectorAll(".home-horizontal__item");

		if (!scroller || items.length === 0) {
			return;
		}

		let targetScrollLeft = scroller.scrollLeft;
		let animationFrameId = null;

		const getMaxScrollLeft = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);

		const animateScroll = () => {
			const distance = targetScrollLeft - scroller.scrollLeft;
			if (Math.abs(distance) < 0.5) {
				scroller.scrollLeft = targetScrollLeft;
				animationFrameId = null;
				return;
			}

			scroller.scrollLeft += distance * 0.12;
			animationFrameId = window.requestAnimationFrame(animateScroll);
		};

		window.addEventListener(
			"wheel",
			(event) => {
				const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
				if (primaryDelta === 0) {
					return;
				}

				event.preventDefault();
				targetScrollLeft = Math.min(
					getMaxScrollLeft(),
					Math.max(0, targetScrollLeft + primaryDelta * 0.75),
				);

				if (animationFrameId === null) {
					animationFrameId = window.requestAnimationFrame(animateScroll);
				}
			},
			{ passive: false },
		);
	};

	const setupDynamicNavbar = () => {
		const navbar = document.querySelector('.hero-header');
		const navLinks = document.querySelectorAll('.hero-nav a');
		const logo = document.querySelector('.hero-logo img');
		
		if (!navbar) return;

		// Function to calculate brightness of a pixel
		const getPixelBrightness = (imageData) => {
			const data = imageData.data;
			let r = 0, g = 0, b = 0;
			const pixelCount = data.length / 4;
			
			for (let i = 0; i < data.length; i += 4) {
				r += data[i];
				g += data[i + 1];
				b += data[i + 2];
			}
			
			r = Math.floor(r / pixelCount);
			g = Math.floor(g / pixelCount);
			b = Math.floor(b / pixelCount);
			
			// Calculate luminance (perceived brightness)
			return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		};

		// Function to sample background color at navbar position
		const sampleBackgroundColor = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			
			// Sample area around navbar center
			const sampleWidth = 100;
			const sampleHeight = 50;
			canvas.width = sampleWidth;
			canvas.height = sampleHeight;
			
			// Get current scroll position
			const scrollX = window.pageXOffset;
			const scrollY = window.pageYOffset;
			
			// Calculate sample position (center of viewport)
			const sampleX = window.innerWidth / 2 - sampleWidth / 2;
			const sampleY = 50; // Near top where navbar is
			
			// Try to get image from current visible area
			const images = document.querySelectorAll('img, .home-horizontal__item');
			let imageData = null;
			
			images.forEach(img => {
				if (imageData) return;
				
				const rect = img.getBoundingClientRect();
				const imgX = rect.left + scrollX;
				const imgY = rect.top + scrollY;
				
				// Check if sample area overlaps with this image
				if (sampleX < imgX + rect.width && sampleX + sampleWidth > imgX &&
					sampleY < imgY + rect.height && sampleY + sampleHeight > imgY) {
					
					try {
						ctx.drawImage(img, 
							sampleX - imgX, sampleY - imgY, sampleWidth, sampleHeight,
							0, 0, sampleWidth, sampleHeight
						);
						imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
					} catch (e) {
						// Image might not be loaded or cross-origin
					}
				}
			});
			
			// If no image data, try to sample from body background
			if (!imageData) {
				const bodyStyle = window.getComputedStyle(document.body);
				const bgColor = bodyStyle.backgroundColor;
				
				// Parse RGB values from background color
				const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
				if (rgbMatch) {
					const r = parseInt(rgbMatch[1]);
					const g = parseInt(rgbMatch[2]);
					const b = parseInt(rgbMatch[3]);
					const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
					return brightness;
				}
				
				// Default to dark if we can't determine
				return 0.3;
			}
			
			return getPixelBrightness(imageData);
		};

		// Function to sample background at specific position
		const sampleBackgroundAtPosition = (x, y, width = 10, height = 10) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			canvas.width = width;
			canvas.height = height;
			
			// Get current scroll position
			const scrollX = window.pageXOffset;
			const scrollY = window.pageYOffset;
			
			// Try to get image from current visible area
			const images = document.querySelectorAll('img, .home-horizontal__item');
			let imageData = null;
			
			images.forEach(img => {
				if (imageData) return;
				
				const rect = img.getBoundingClientRect();
				const imgX = rect.left + scrollX;
				const imgY = rect.top + scrollY;
				
				// Check if sample area overlaps with this image
				if (x < imgX + rect.width && x + width > imgX &&
					y < imgY + rect.height && y + height > imgY) {
					
					try {
						ctx.drawImage(img, 
							x - imgX, y - imgY, width, height,
							0, 0, width, height
						);
						imageData = ctx.getImageData(0, 0, width, height);
					} catch (e) {
						// Image might not be loaded or cross-origin
					}
				}
			});
			
			// If no image data, try to sample from body background
			if (!imageData) {
				const bodyStyle = window.getComputedStyle(document.body);
				const bgColor = bodyStyle.backgroundColor;
				
				// Parse RGB values from background color
				const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
				if (rgbMatch) {
					const r = parseInt(rgbMatch[1]);
					const g = parseInt(rgbMatch[2]);
					const b = parseInt(rgbMatch[3]);
					const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
					return brightness;
				}
				
				// Default to dark if we can't determine
				return 0.3;
			}
			
			return getPixelBrightness(imageData);
		};

		// Throttle function to limit update frequency
		const throttle = (func, delay) => {
			let timeoutId;
			let lastExecTime = 0;
			return function (...args) {
				const currentTime = Date.now();
				
				if (currentTime - lastExecTime > delay) {
					func.apply(this, args);
					lastExecTime = currentTime;
				} else {
					clearTimeout(timeoutId);
					timeoutId = setTimeout(() => {
						func.apply(this, args);
						lastExecTime = Date.now();
					}, delay - (currentTime - lastExecTime));
				}
			};
		};

		// Function to update navbar colors based on brightness (simplified version)
		const updateNavbarColors = () => {
			navLinks.forEach(link => {
				if (link.classList.contains('work-link')) {
					// Preserve gradient for Work With Me link (using actual colors from theme.css)
					link.style.background = 'linear-gradient(90deg, #00C9B1 0%, #2C468F 100%)';
					link.style.webkitBackgroundClip = 'text';
					link.style.webkitTextFillColor = 'transparent';
					link.style.backgroundClip = 'text';
					return;
				}
				
				// Simplified: Sample at link center instead of letter-by-letter
				const rect = link.getBoundingClientRect();
				const linkCenterX = rect.left + window.pageXOffset + rect.width / 2;
				const linkCenterY = rect.top + window.pageYOffset + rect.height / 2;
				
				// Sample background at this link's position (larger sample for performance)
				const brightness = sampleBackgroundAtPosition(linkCenterX - 10, linkCenterY - 5, 20, 10);
				
				if (brightness > 0.5) {
					// Bright background - use dark colors
					link.style.color = '#000000';
					link.style.setProperty('-webkit-text-fill-color', '#000000');
					link.style.background = 'none';
				} else {
					// Dark background - use light colors
					link.style.color = '#ffffff';
					link.style.setProperty('-webkit-text-fill-color', '#ffffff');
					link.style.background = 'none';
				}
			});
			
			// Update logo based on navbar center position
			if (logo) {
				const logoRect = logo.getBoundingClientRect();
				const logoCenterX = logoRect.left + window.pageXOffset + logoRect.width / 2;
				const logoCenterY = logoRect.top + window.pageYOffset + logoRect.height / 2;
				const logoBrightness = sampleBackgroundAtPosition(logoCenterX - 5, logoCenterY - 5);
				
				if (logoBrightness > 0.5) {
					logo.style.filter = 'none';
				} else {
					logo.style.filter = 'brightness(0) invert(1)';
				}
			}
		};

		// Create throttled version of update function
		const throttledUpdateNavbarColors = throttle(updateNavbarColors, 100);

		// Initial update
		updateNavbarColors();

		// Update on scroll for homepage (using throttled version)
		if (document.body.classList.contains('home-page')) {
			const scroller = document.querySelector('.home-horizontal__sticky');
			if (scroller) {
				scroller.addEventListener('scroll', throttledUpdateNavbarColors);
			}
			window.addEventListener('scroll', throttledUpdateNavbarColors);
		}

		// Update on window resize (using throttled version)
		window.addEventListener('resize', throttledUpdateNavbarColors);
		
		// Update periodically less frequently (reduced from 500ms to 1000ms)
		setInterval(throttledUpdateNavbarColors, 1000);
	};

	setupPageTransitions();
	setupHomeIntro();
	setupHomeHorizontalCarousel();
	setupDynamicNavbar();

	const revealTargets = document.querySelectorAll(
		"body.about-page .about-image-hero, body.about-page .about-image-two, body.about-page .values-section, body.about-page .investing-section, body.about-page .contact-banner, body.about-page .about-footer, body.about-page .value-card, body.business-page .business-image-one, body.business-page .business-image-two, body.business-page .business-image-one__quote, body.business-page .business-image-one__text, body.business-page .business-image-two__content, body.business-page .business-image-two__logo, body.business-page .business-image-two__content-flipped, body.business-page .business-image-two__logo-flipped, body.business-page .business-partners, body.business-page .business-partners__intro, body.business-page .business-partners__collab, body.business-page .business-partners__offers, body.gallery-page .gallery-hero, body.gallery-page .gallery-filters, body.gallery-page .gallery-item-1, body.gallery-page .gallery-item-2, body.gallery-page .gallery-item-3, body.gallery-page .gallery-item-4, body.gallery-page .gallery-item-5, body.gallery-page .gallery-item-6, body.gallery-page .gallery-item-7, body.gallery-page .contact-banner, body.gallery-page .about-footer, body.social-impact-page .social-impact-hero, body.social-impact-page .social-impact-quote, body.social-impact-page .social-values-section, body.social-impact-page .social-values-description, body.social-impact-page .social-value-card, body.social-impact-page .social-impact-gallery, body.social-impact-page .social-future, body.social-impact-page .social-future__heading, body.social-impact-page .social-future__cta, body.social-impact-page .social-future__grid, body.social-impact-page .contact-banner, body.social-impact-page .about-footer, body.work-with-me-page .work-hero, body.work-with-me-page .work-hero__quote, body.work-with-me-page .work-partnerships, body.work-with-me-page .partnership-card, body.work-with-me-page .partnerships-footer, body.work-with-me-page .work-contact-booking, body.work-with-me-page .work-contact-booking__info, body.work-with-me-page .work-contact-booking__form, body.work-with-me-page .about-footer",
	);

	if (!revealTargets.length) {
		return;
	}

	revealTargets.forEach((target, index) => {
		target.classList.add("reveal-item");
		target.style.setProperty("--reveal-delay", `${Math.min(index * 90, 540)}ms`);
	});

	if (!("IntersectionObserver" in window)) {
		revealTargets.forEach((target) => target.classList.add("is-visible"));
		return;
	}

	const observer = new IntersectionObserver(
		(entries, observerInstance) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					observerInstance.unobserve(entry.target);
				}
			});
		},
		{
			threshold: 0.15,
			rootMargin: "0px 0px -8% 0px",
		},
	);

	revealTargets.forEach((target) => observer.observe(target));
});
