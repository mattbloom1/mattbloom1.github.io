const btn = document.getElementById("spin");
btn.addEventListener("click", roll);

const btnAdd = document.getElementById("addNum");
btnAdd.addEventListener("click", conPhoneNum);

const btnClear = document.getElementById("clearNum");
btnClear.addEventListener("click", clearPhoneNumber);

const result = document.getElementById("result");
const winNum = document.getElementById("winNum");
const spinsLeft = document.getElementById("spinsLeft");

var allNumbers = [];
var number = [];
var count = 0;
var winNumb = 0;


var spins = 30;

function roll() {
    if(number.length < 10 && count < spins){
        var randomNum = Number((Math.random() * 100).toFixed(2));
        var firstDigit = Number(Math.floor((randomNum) / 10 - 5));
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
        spinsLeft.innerText = "Spins Left - " + (spins - count);
        displayWinningNumber();

    }
    else{
        alert("You have reached the maximum number of spins.");
    }
}

function conPhoneNum(){
    if(number.length < 10){
    number.push(allNumbers[count-1]);
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
    spins = 15;
    winNum.innerText = "Number to be added - ?";
    spinsLeft.innerText = "Spins Left - " + (spins - count);
    displayPhoneNumber();
}
function displayPhoneNumber() {
    var phoneNumber = number.join("");
    var formattedPhoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    result.innerText = formattedPhoneNumber;
}