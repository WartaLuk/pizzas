/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
	('use strict');

	const select = {
		templateOf: {
			menuProduct: '#template-menu-product'
		},
		containerOf: {
			menu: '#product-list',
			cart: '#cart'
		},
		all: {
			menuProducts: '#product-list > .product',
			menuProductsActive: '#product-list > .product.active',
			formInputs: 'input, select'
		},
		menuProduct: {
			clickable: '.product__header',
			form: '.product__order',
			priceElem: '.product__total-price .price',
			imageWrapper: '.product__images',
			amountWidget: '.widget-amount',
			cartButton: '[href="#add-to-cart"]'
		},
		widgets: {
			amount: {
				input: 'input[name="amount"]',
				linkDecrease: 'a[href="#less"]',
				linkIncrease: 'a[href="#more"]'
			}
		}
	};

	const classNames = {
		menuProduct: {
			wrapperActive: 'active',
			imageVisible: 'active'
		}
	};

	const settings = {
		amountWidget: {
			defaultValue: 1,
			defaultMin: 0,
			defaultMax: 10
		}
	};

	const templates = {
		menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML)
	};
	class Product {
		constructor(id, data) {
			const thisProduct = this;
			thisProduct.id = id;
			thisProduct.data = data;
			thisProduct.renderInMenu();
			thisProduct.getElements();
			thisProduct.initAccordion();
			thisProduct.initOrderForm();
			thisProduct.initAmountWidget();
			thisProduct.processOrder();

		}
		renderInMenu() {
			const thisProduct = this;
			const generatedHTML = templates.menuProduct(thisProduct.data);
			thisProduct.element = utils.createDOMFromHTML(generatedHTML);
			const menuContainer = document.querySelector(select.containerOf.menu);
			menuContainer.appendChild(thisProduct.element);
		}
		getElements() {
			const thisProduct = this;
			thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
			thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
			thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
			thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
			thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
			thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
			thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
		}
		initAccordion() {
			const thisProduct = this;
			thisProduct.accordionTrigger.addEventListener('click', function(event) {
				event.preventDefault();
				const activeProduct = document.querySelector(select.all.menuProductsActive);
				if (activeProduct != null && activeProduct != thisProduct.element) {
					activeProduct.classList.remove('active');
				}
				thisProduct.element.classList.toggle('active');
			});
		}
		initOrderForm() {
			const thisProduct = this;
			thisProduct.form.addEventListener('submit', function(event) {
				event.preventDefault();
				thisProduct.processOrder();
			});
			for (let input of thisProduct.formInputs) {
				input.addEventListener('change', function() {
					thisProduct.processOrder();
				});
			}
			thisProduct.cartButton.addEventListener('click', function(event) {
				event.preventDefault();
				thisProduct.processOrder();
			});
		}
		processOrder() {
			const thisProduct = this;
			const formData = utils.serializeFormToObject(thisProduct.form);
			let price = thisProduct.data.price;
			for (let paramId in thisProduct.data.params) {
				const param = thisProduct.data.params[paramId];
				for (let optionId in param.options) {
					const option = param.options[optionId];
					const optionSelected = formData[paramId].includes(optionId);
					if (!option.default && optionSelected) {
						price += option.price;
					} else if (option.default && !optionSelected) {
						price -= option.price;
					}
					const classImg = '.' + paramId + '-' + optionId;
					let optionImage = thisProduct.imageWrapper.querySelector(classImg);
					if (optionImage != null) {
						if (optionSelected) {
							optionImage.classList.add(classNames.menuProduct.imageVisible);
						} else {
							optionImage.classList.remove(classNames.menuProduct.imageVisible);
						}
					}
				}
			}
			price *= thisProduct.amountWidget.value;
			thisProduct.priceElem.innerHTML = price;
		}
		initAmountWidget() {
			const thisProduct = this;
			thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
			thisProduct.amountWidgetElem.addEventListener('updated', function() {
				thisProduct.processOrder();
			});
		}
	}
	class AmountWidget {
		constructor(element) {
			const thisWidget = this;
			thisWidget.getElements(element);
			thisWidget.initActions();
			thisWidget.setValue(thisWidget.input.value);

			console.log('AmountWidget:', thisWidget);
			console.log('constructor arguments:', element);
		}
		getElements(element) {
			const thisWidget = this;

			thisWidget.element = element;
			thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
			thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
			thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
			thisWidget.value = settings.amountWidget.defaultValue;
		}
		setValue(value) {
			const thisWidget = this;
			const newValue = parseInt(value);
			if (
				thisWidget.value !== newValue &&
				!isNaN(newValue) &&
				newValue >= settings.amountWidget.defaultMin &&
				newValue <= settings.amountWidget.defaultMax
			) {
				thisWidget.announce();
				thisWidget.value = newValue;
			}
			thisWidget.input.value = thisWidget.value;
		}
		initActions() {
			const thisWidget = this;
			thisWidget.input.addEventListener('change', function() {
				thisWidget.setValue(thisWidget.input.value);
			});
			thisWidget.linkDecrease.addEventListener('click', function(event) {
				event.preventDefault();
				thisWidget.setValue(thisWidget.value - 1);
			});
			thisWidget.linkIncrease.addEventListener('click', function(event) {
				event.preventDefault();
				thisWidget.setValue(thisWidget.value + 1);
			});
		}
		announce() {
			const thisWidget = this;
			const event = new Event('updated');
			thisWidget.element.dispatchEvent(event);
		}
	}
	class Cart {
		constructor(element) {
			const thisCart = this;
			thisCart.products = [];

			thisCart.getElements(element);
			thisCart.initActions();

			console.log('new Cart', thisCart);
		}
		getElements(element) {
			const thisCart = this;
			thisCart.dom = {};
			thisCart.dom.wrapper = element;
			thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
			thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
		}
		initActions() {
			const thisCart = this;

			thisCart.dom.toggleTrigger.addEventListener('click', function() {
				thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
			});
		}
	}

	const app = {
		initMenu: function() {
			const thisApp = this;
			console.log('thisApp.data:', thisApp.data);
			for (let productData in thisApp.data.products) {
				new Product(productData, thisApp.data.products[productData]);
			}
		},
		initCart: function() {
			const thisApp = this;

			const cartElem = document.querySelector(select.containerOf.cart);
			thisApp.cart = new Cart(cartElem);
		},
		initData: function() {
			const thisApp = this;
			thisApp.data = dataSource;
		},
		init: function() {
			const thisApp = this;
			console.log('*** App starting ***');
			console.log('thisApp:', thisApp);
			console.log('classNames:', classNames);
			console.log('settings:', settings);
			console.log('templates:', templates);

			thisApp.initData();
			thisApp.initMenu();
		}
	};

	app.init();
}
