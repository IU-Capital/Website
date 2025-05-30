document.addEventListener("DOMContentLoaded", () => {
  
  var product_data = [
    {
      name: "Monthly Plan", 
      discount: "",
      price: "$ TBA",
      stripe_link: "#",
      crypto_link: "#"
    },
    {
      name: "Quarterly Plan (3 Months)",
      discount: "",
      price: "$ TBA",
      stripe_link: "#",
      crypto_link: "#"
    },
    {
      name: "Semi-Annual Plan (6 Months)",
      discount: "",
      price: "$ TBA",
      stripe_link: "#",
      crypto_link: "#"
    },
    {
      name: "Annual Plan (12 Months)",
      discount: "",
      price: "$ TBA",
      stripe_link: "#",
      crypto_link: "#"
    }
  ];

  let stripe_button_link;
  let crypto_button_link;
  let product_select = document.querySelector("#product_checkout_select");

  product_data.forEach((product, i) => {
    const option = document.createElement("option");
    option.id = i;
    option.value = i;
    option.textContent = product.name;
    product_select.appendChild(option);
  });

  // Default values
  product_select.value = 0;
  const discount_price = document.querySelector(".product_checkout_amount .discount p");
  const total_price = document.querySelector(".product_checkout_amount .total p");

  discount_price.innerText = product_data[product_select.value].discount;
  total_price.innerText = product_data[product_select.value].price;

  stripe_button_link = () => (window.location.href = product_data[product_select.value].stripe_link);
  crypto_button_link = () => (window.location.href = product_data[product_select.value].crypto_link);

  product_select.addEventListener("input", () => {
    discount_price.innerText = product_data[product_select.value].discount;
    total_price.innerText = product_data[product_select.value].price;
    stripe_button_link = () => (window.location.href = product_data[product_select.value].stripe_link);
    crypto_button_link = () => (window.location.href = product_data[product_select.value].crypto_link);
  });
})

