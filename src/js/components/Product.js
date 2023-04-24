import { select, classNames, templates } from '../settings.js';
import utils from '../utils.js';
import amountWidget from './components/amountWidget.js';

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
    thisProduct.dom = {};
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

    thisProduct.accordionTrigger.addEventListener('click', function (event) {
      event.preventDefault();

      const activeProducts = document.querySelector(select.all.menuProductsActive);
      if (activeProducts != null && activeProducts != thisProduct.element) {
        activeProducts.classList.remove('active');
      }
      thisProduct.element.classList.toggle('active');
    });
  }
  initOrderForm() {
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
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

        const imageForOption = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        if (imageForOption) {
          if (formData[paramId] && formData[paramId].includes(optionId)) {
            imageForOption.classList.add(classNames.menuProduct.imageVisible);
          }
          else {
            imageForOption.classList.remove(classNames.menuProduct.imageVisible);
          }
        }

        if (formData[paramId] && formData[paramId].includes(optionId)) {
          if (!option['default']) {
            price = price + option.price;
          }
        }
        else {
          if (option['default']) {
            price = price - option.price;
          }
        }
      }
    }
    thisProduct.priceSingle = price;

    price *= thisProduct.amountWidget.value;
    thisProduct.priceElem.innerHTML = price;
  }
  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new amountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }
  prepareCartProduct() {
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.amountWidget.value * thisProduct.priceSingle,
      params: thisProduct.prepareCartProductParams(),
    };
    return productSummary;
  }
  prepareCartProductParams() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);

    const productParamsSummary = {};

    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      if (formData[paramId]) {

        const singleParam = { label: param.label };
        singleParam.options = {};

        for (let optionId in param.options) {
          const option = param.options[optionId];

          if (formData[paramId].includes(optionId)) {
            singleParam.options[optionId] = option.label;
          }
        }
        productParamsSummary[paramId] = singleParam;
      }
    }
    return productParamsSummary;
  }
  addToCart() {
    const thisProduct = this;

    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      }
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;