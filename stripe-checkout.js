import STRIPE_KEYS from "./stripe-keys.js";

const d = document,
  $productos = d.getElementById("productos"),
  $template = d.getElementById("producto-template").content,
  $fragment = d.createDocumentFragment();

const fetchOptions = {
  headers: {
    Authorization: `Bearer ${STRIPE_KEYS.secret}`,
  },
};

let products, prices; //En estas variables guardamos lo que nos regresen ambos fetch

const moneyFormat = (num) => `$${num.slice(0, -2)}.${num.slice(-2)}`;

Promise.all([
  //El orden de las peticiones va a dar el orden en que vendran en la respuesta .json
  fetch("https://api.stripe.com/v1/products", fetchOptions),
  fetch("https://api.stripe.com/v1/prices", fetchOptions),
])
  .then((responses) => Promise.all(responses.map((res) => res.json()))) //Este .then() toma todas las respuestas (de "Promise.all()"), por cada una de las respuestas las agregamos en formato json
  //Hasta acá la respuesta nos va a dar un array de objetos, siendo cada objeto cada una de los fetch hechos
  .then((json) => {
    //console.log(json);
    products = json[0].data; //de todos los datos que nos trae la respuesta .json, sólo nos interesa lo que viene en la variable "data"
    prices = json[1].data;
    //console.log(products)
    //console.log(prices)
    prices.forEach((el) => {
      //Vamos a programar que hacer con cada elemento de cada json
      let productData = products.filter((product) => product.id === el.product); //Te vas a meter en el json de los productos y vas a comparar el id del producto en products.json con el id del producto en prices.json
      // console.log(el);
      // console.log(productData);

      $template.querySelector(".producto").setAttribute("data-price", el.id);
      $template.querySelector("img").src = productData[0].images[0];
      $template.querySelector("img").alt = productData[0].name;
      $template.querySelector("figcaption").innerHTML = `${productData[0].name} 
      <br>
      ${moneyFormat(el.unit_amount_decimal)} ${el.currency}
      `;

      let $clone = d.importNode($template, true);
      $fragment.appendChild($clone);
    });

    $productos.appendChild($fragment);
  })
  .catch((err) => {
    console.log(err);
    let message = err.statusText || "Ocurrió un error al conectarse con la API";
    $productos.innerHTML = `<p>Error ${err.status}: ${message}</p>`;
  });

d.addEventListener("click", (e) => {
  if (e.target.matches(".producto *")) {
    //Si el evento click se hace en cualquier cosa que este dentro de la etiqueta html con el id producto:
    let price = e.target.parentElement.getAttribute("data-price");
    Stripe(STRIPE_KEYS.public)
      .redirectToCheckout({
        lineItems: [{ price, quantity: 1 }],
        mode: "subscription",
        successUrl: "http://127.0.0.1:5500/stripe-success.html",
        cancelUrl: "http://127.0.0.1:5500/assets/stripe-cancel.html",
      })
      .then((res) => {
        if (res.error) {
          console.log(res);
          $productos.insertAdjacentHTML("afterend", res.error.message);
        }
      });
  }
});
