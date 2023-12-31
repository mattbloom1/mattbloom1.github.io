const btn = document.getElementById("spin");
btn.addEventListener("click", roll);

const btnAdd = document.getElementById("addNum");
btnAdd.addEventListener("click", conPhoneNum);

const btnClear = document.getElementById("clearNum");
btnClear.addEventListener("click", clearPhoneNumber);

const btnSubmit = document.getElementById("submit");
btnSubmit.addEventListener("click", submitPhoneNumber);

const result = document.getElementById("result");
const winNum = document.getElementById("winNum");
const spinsLeft = document.getElementById("spinsLeft");

var allNumbers = [];
var number = [];
var count = 0;
var winNumb = 0;
var numUsed = false;


var spins = 99;
var lastNumber = null;

function roll() {
    numUsed = false;
    if(number.length < 10 && count < spins){
        document.getElementById("roll").style.marginTop = "-360px";
        
        setTimeout(function() {
            var randomNum;
            var firstDigit;
            do {
                randomNum = Number((Math.random() * 100).toFixed(2));
                firstDigit = Number(Math.floor((randomNum) / 10 - 5));
            } while (firstDigit === lastNumber);
            lastNumber = firstDigit;

            var win = firstDigit;
            if (win > 4) {
                var rollm = win * 40 - 40 * 15;
                document.getElementById("roll").style.marginTop = rollm + "px";
            }
            if (win < 4) {
                var rollm = 180 - 40 * win - 380;
                document.getElementById("roll").style.marginTop = rollm + "px";
            }
            if (win == 4) {
                var rollm = 360;
                document.getElementById("roll").style.marginTop = "-" + rollm + "px";
            }
            allNumbers.push(Math.floor(randomNum/10));
            winNumb = Math.floor(randomNum/10);
            count++;
        }, 500); // Delay for the full spin animation
    }
    else{
        alert("You have reached the maximum number of spins.");
    }
}
function conPhoneNum(){
    if(number.length < 10 && numUsed === false){
    number.push(allNumbers[count-1]);
    numUsed = true;
    }
    else if (number.length < 10 && numUsed === true) {
        alert("You have already used this number. Spin again.");
    }
    else{
        alert("You have reached the maximum number of digits.");
    }
    displayPhoneNumber();
}
function displayWinningNumber() {
    var winningNumber = winNumb;
    winNum.innerText = "Number to be added - " + winningNumber;
}
function clearPhoneNumber() {
    number = [];
    allNumbers = [];
    count = 0;
    spins = 99;
    displayPhoneNumber();
}
function displayPhoneNumber() {
    var phoneNumber = number.join("");
    var formattedPhoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    
    if (phoneNumber.length >= 4 && phoneNumber.length < 7) {
        formattedPhoneNumber = phoneNumber.replace(/(\d{3})(\d{1})/, "$1-$2");
    } else if (phoneNumber.length >= 7) {
        formattedPhoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{1})/, "$1-$2-$3");
    }
    else if(phoneNumber.length === 10)
    {
        formattedPhoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    
    result.innerText = formattedPhoneNumber;
}

function submitPhoneNumber() {
    alert("Your phone number has been submitted." + "\n" + result.innerText);
    number = [];
    allNumbers = [];
    count = 0;
    spins = 99;
    displayPhoneNumber();
}

var submitButton = document.getElementById('submit');

submitButton.addEventListener('mouseover', function() {
    if (number.length < 10) {
        var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        var buttonWidth = submitButton.offsetWidth;
        var buttonHeight = submitButton.offsetHeight;

        var randomLeft = Math.floor(Math.random() * (vw - buttonWidth)) + 'px';
        var randomTop = Math.floor(Math.random() * (vh - buttonHeight)) + 'px';

        submitButton.style.position = 'absolute';
        submitButton.style.left = randomLeft;
        submitButton.style.top = randomTop;
    }
});