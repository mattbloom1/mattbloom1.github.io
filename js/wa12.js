const newQuoteButton = document.querySelector("#js-new-quote");

const copyQuoteButton = document.querySelector("#js-copy-text");

newQuoteButton.addEventListener("click", getQuote);
copyQuoteButton.addEventListener("click", myFunction);

function getQuote() {
    console.log("Button clicked!");
    
    const apiEndpoint = "https://www.boredapi.com/api/activity";

    fetch(apiEndpoint)
    .then(response => {
        if (response.ok) {
        return response.json();
        } else {
        console.error("Failed to fetch quote");
        throw new Error("Failed to fetch quote");
        }
    })
    .then(data => {
        displayQuote(data);
    })
    .catch(error => {
        console.error(error);
        alert("Failed to fetch quote");
    });
}

function displayQuote(quote) {
    document.getElementById("js-quote-text").innerText = quote.activity;
    document.getElementById("js-quote-type").innerText = quote.type;
    document.getElementById("js-quote-participants").innerText = quote.participants;
    document.getElementById("js-quote-price").innerText = "$" + quote.price;
}

function myFunction() {
    var copyText = document.getElementById("js-quote-text").innerText;

    navigator.clipboard.writeText(copyText);
  
    alert("Copied the text: " + copyText);
  }

getQuote();
