


document.addEventListener("DOMContentLoaded", () => {
    var product_data = [
        {
          name: "1 Hour Consultation",
          discount: "$80.00 USD",
          price: "$50.00 USD",
          stripe_link: "https://buy.stripe.com/00gcNo2txdro7WEfZh"            
        },
        {
          name: "2 Hour  Consultation",
          discount: "$160.00 USD",
          price: "$90.00 USD",
          stripe_link: "https://buy.stripe.com/bIY28K4BF730dgYcN6"            
        },
        {
          name: "3 Hour  Consultation",
          discount: "$240.00 USD",
          price: "$135.00 USD",
          stripe_link: "https://buy.stripe.com/14k3cO4BFbjg5OwcN7"            
        },
      ]
    
      let stripe_button_link
    
      let crypto_button_link
    
      let  product_select = document.querySelector("#product_checkout_select")
     
    
      
      product_data.forEach((product, i) => {
        const option = document.createElement("option")
        option.id = i
        option.value = i
        option.innerHTML = `<p>${product.name}</p>`
        product_select.appendChild(option)
      })
    
    
    
      
    //  DEAFAULT VALUES
    product_select = document.querySelector("#product_checkout_select")
    const discount_price = document.querySelector(
        ".product_checkout_amount .discount p"
      )
      const total_price = document.querySelector(
        ".product_checkout_amount .total p"
      )
    
      discount_price.innerText = product_data[product_select.value].discount
      total_price.innerText = product_data[product_select.value].price
      stripe_button_link = () =>
        (window.location.href = product_data[product_select.value].stripe_link)
      crypto_button_link = () =>
        (window.location.href = product_data[product_select.value].crypto_link)
        // END DEAFAULT VALUES
    
    
      product_select.addEventListener("input", (e) => {
        console.log(product_select.value)
    
        const discount_price = document.querySelector(
          ".product_checkout_amount .discount p"
        )
        const total_price = document.querySelector(
          ".product_checkout_amount .total p"
        )
        discount_price.innerText = product_data[product_select.value].discount
        total_price.innerText = product_data[product_select.value].price
    
        stripe_button_link = () =>
          (window.location.href = product_data[product_select.value].stripe_link)
    
        crypto_button_link = () =>
          (window.location.href = product_data[product_select.value].crypto_link)
      })
})
  
  