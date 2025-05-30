document.addEventListener("DOMContentLoaded", () => {

    const urlParams = new URLSearchParams(window.location.search);
    const urlPlan = urlParams.get('plan');
    const planInput = document.getElementById('plan');
    const form = document.getElementById('registrationForm');
    const emailInput = form.email;
    const passwordInput = form.password;
    const confirmPasswordInput = form.confirmPassword;
    const status = document.getElementById('formStatus');
    const planSelect = document.getElementById("product_checkout_select");
    const selectedPlanName = document.getElementById("selected-plan-name");
    const selectedPlanPrice = document.getElementById("selected-plan-price");
    const planDetails = document.getElementById("plan-details");
  
    const product_data = [
      {
        name: "Monthly Plan",
        price: "$11.99 USD / month",
        stripe_link: "https://buy.stripe.com/test_123monthly"
      },
      {
        name: "Quarterly Plan",
        price: "$29.99 USD / 3 months",
        stripe_link: "https://buy.stripe.com/test_123quarterly"
      },
      {
        name: "Bi-Annual Plan",
        price: "$64.99 USD / 6 months",
        stripe_link: "https://buy.stripe.com/test_123semiannual"
      },
      {
        name: "Annual Plan",
        price: "$134.99 USD / 12 months",
        stripe_link: "https://buy.stripe.com/test_123annual"
      }
    ];
  
    // Populate the select options
    product_data.forEach((product, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = product.name;
      planSelect.appendChild(option);
    });
  
    // Preselect plan from URL if available
    if (urlPlan) {
      const idx = product_data.findIndex(p => p.name.toLowerCase() === urlPlan.toLowerCase());
      if (idx !== -1) {
        planSelect.value = idx;
        updatePlanSelection(idx);
      }
    }
  
    planSelect.addEventListener("change", () => {
      updatePlanSelection(planSelect.value);
    });
  
    function updatePlanSelection(index) {
      const selected = product_data[index];
      selectedPlanName.textContent = selected.name;
      selectedPlanPrice.textContent = selected.price;
      planDetails.style.display = "block";
      planInput.value = selected.name;  // Update the hidden input with plan name
      console.log("Plan selected:", selected.name);  // Debug log
    }
  
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      status.textContent = "";
      [passwordInput, confirmPasswordInput].forEach(input => input.classList.remove('error'));
  
      let hasError = false;
  
      if (passwordInput.value.length < 6) {
        showError(passwordInput, "Password must be at least 6 characters.");
        hasError = true;
      }
  
      if (passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordInput, "Passwords do not match.");
        hasError = true;
      }
  
      if (hasError) return;
  
      try {              
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value,
            password: passwordInput.value,
            plan: planInput.value
          })
        });
  
        const result = await response.json();
  
        if (response.ok) {
          window.location.href = setupRedirectURL;
        } else {
          status.textContent = result.error || "Registration failed.";
        }
      } catch (error) {
        status.textContent = "Error connecting to server.";
        console.error("Error:", error);
      }
    });
  
    function showError(input, message) {
      status.textContent = message;
      input.classList.add('error', 'shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    }
});