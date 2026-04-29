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

	const setupAdaptiveNavigation = () => {
		if (!document.body.classList.contains("home-page")) {
			return;
		}

		const scroller = document.querySelector(".home-horizontal__sticky");
		const navLinks = document.querySelectorAll(".hero-nav a:not(.work-link), .legal-links a");
		const logoImg = document.querySelector(".hero-logo");
		const items = document.querySelectorAll(".home-horizontal__item");

		if (!scroller || (navLinks.length === 0 && !logoImg) || items.length === 0) {
			return;
		}

		// Cache image brightness values
		const imageCache = new Map();

		const getImageBrightness = (img) => {
			return new Promise((resolve) => {
				if (!img || !img.complete) {
					resolve(0.5); // Default medium brightness
					return;
				}

				if (imageCache.has(img)) {
					resolve(imageCache.get(img));
					return;
				}

				const canvas = document.createElement("canvas");
				canvas.width = 50;
				canvas.height = 50;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					resolve(0.5);
					return;
				}

				try {
					ctx.drawImage(img, 0, 0, 50, 50);
					const imageData = ctx.getImageData(0, 0, 50, 50);
					const data = imageData.data;

					let r = 0, g = 0, b = 0;
					for (let i = 0; i < data.length; i += 16) {
						r += data[i];
						g += data[i + 1];
						b += data[i + 2];
					}

					const pixelCount = data.length / 16;
					const avgR = r / pixelCount;
					const avgG = g / pixelCount;
					const avgB = b / pixelCount;

					// Luminance formula
					const brightness = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
					imageCache.set(img, brightness);
					resolve(brightness);
				} catch (e) {
					resolve(0.5);
				}
			});
		};

		const findVisibleItemForElement = (element) => {
			const rect = element.getBoundingClientRect();
			const scrollerRect = scroller.getBoundingClientRect();
			const elementCenterX = rect.left - scrollerRect.left + rect.width / 2;
			const scrollLeft = scroller.scrollLeft;
			const absoluteX = scrollLeft + elementCenterX;

			let visibleItem = null;
			let closestDistance = Infinity;

			items.forEach((item) => {
				const itemLeft = item.offsetLeft;
				const itemRight = itemLeft + item.offsetWidth;
				const itemCenter = (itemLeft + itemRight) / 2;
				const distance = Math.abs(itemCenter - absoluteX);

				if (distance < closestDistance) {
					closestDistance = distance;
					visibleItem = item;
				}
			});

			return visibleItem;
		};

		const updateElementColor = async (element) => {
			const visibleItem = findVisibleItemForElement(element);

			if (!visibleItem) {
				element.classList.remove("nav-dark", "nav-light");
				element.classList.add("nav-light");
				return;
			}

			const img = visibleItem.querySelector("img");
			if (!img) {
				element.classList.remove("nav-dark", "nav-light");
				element.classList.add("nav-light");
				return;
			}

			const brightness = await getImageBrightness(img);
			element.classList.remove("nav-dark", "nav-light");

			if (brightness < 0.5) {
				element.classList.add("nav-dark");
			} else {
				element.classList.add("nav-light");
			}
		};

		const updateAllElements = async () => {
			const promises = [];

			navLinks.forEach((link) => {
				promises.push(updateElementColor(link));
			});

			if (logoImg) {
				promises.push(updateElementColor(logoImg));
			}

			await Promise.all(promises);
		};

		// Pre-cache all images
		items.forEach((item) => {
			const img = item.querySelector("img");
			if (img) {
				img.addEventListener("load", () => getImageBrightness(img));
			}
		});

		// Update on scroll with debouncing
		let scrollTimeout;
		scroller.addEventListener("scroll", () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(updateAllElements, 50);
		}, { passive: true });

		// Initial update
		setTimeout(updateAllElements, 100);
	};

	setupPageTransitions();
	setupHomeIntro();
	setupHomeHorizontalCarousel();
	setupAdaptiveNavigation();

	const revealTargets = document.querySelectorAll(
		"body.about-page .about-image-hero, body.about-page .about-image-two, body.about-page .values-section, body.about-page .investing-section, body.about-page .contact-banner, body.about-page .about-footer, body.about-page .value-card, body.about-page .about-image-hero__content, body.about-page .about-image-two__text-right, body.about-page .about-image-two__text-left, body.about-page .about-image-two__text-right-down, body.global-ambassador-page .about-image-hero, body.global-ambassador-page .global-ambassador-hero__block--intro, body.global-ambassador-page .global-ambassador-hero__block--statement, body.global-ambassador-page .values-section, body.global-ambassador-page .value-card, body.global-ambassador-page .investing-section, body.global-ambassador-page .investing-image, body.global-ambassador-page .investing-copy, body.global-ambassador-page .speaker-topics, body.global-ambassador-page .speaker-panels, body.global-ambassador-page .speaker-button, body.global-ambassador-page .contact-banner, body.global-ambassador-page .about-footer, body.business-page .business-image-one, body.business-page .business-image-two, body.business-page .business-image-one__quote, body.business-page .business-image-one__text, body.business-page .business-image-two__content, body.business-page .business-image-two__logo, body.business-page .business-image-two__content-flipped, body.business-page .business-image-two__logo-flipped, body.business-page .business-partners, body.business-page .business-partners__intro, body.business-page .business-partners__collab, body.business-page .business-partners__offers, body.gallery-page .gallery-hero, body.gallery-page .gallery-filters, body.gallery-page .gallery-item-1, body.gallery-page .gallery-item-2, body.gallery-page .gallery-item-3, body.gallery-page .gallery-item-4, body.gallery-page .gallery-item-5, body.gallery-page .gallery-item-6, body.gallery-page .gallery-item-7, body.gallery-page .contact-banner, body.gallery-page .about-footer, body.social-impact-page .social-impact-hero, body.social-impact-page .social-impact-quote, body.social-impact-page .social-values-section, body.social-impact-page .social-values-description, body.social-impact-page .social-value-card, body.social-impact-page .social-impact-gallery, body.social-impact-page .social-future, body.social-impact-page .social-future__heading, body.social-impact-page .social-future__cta, body.social-impact-page .social-future__grid, body.social-impact-page .contact-banner, body.social-impact-page .about-footer, body.work-with-me-page .work-hero__image, body.work-with-me-page .work-hero__content, body.work-with-me-page .work-hero__content h1, body.work-with-me-page .work-hero__content p, body.work-with-me-page .work-hero__quote, body.work-with-me-page .work-partnerships, body.work-with-me-page .partnership-card, body.work-with-me-page .partnerships-footer, body.work-with-me-page .work-contact-booking, body.work-with-me-page .work-contact-booking__inner, body.work-with-me-page .work-contact-booking__info, body.work-with-me-page .work-contact-booking__form, body.work-with-me-page .about-footer",
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
