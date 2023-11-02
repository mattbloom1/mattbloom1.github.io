
const customName = document.getElementById('customname');
const randomize = document.querySelector('.randomize');
const story = document.querySelector('.story');

function randomValueFromArray(array){
  const random = Math.floor(Math.random()*array.length);
  return array[random];
}

let storyText = `It was 94 fahrenheit outside, so :insertx: went to go skate. When they got to :inserty:, they began waxing the park and warming up, then :insertz:. Bob saw the whole thing, but was not surprised — :insertx: weighs 300 pounds, and it was a hot day for a big boy on a skateboard.`

let insertX = ['Tony Hawk', 'Nyjah Huston', 'Leticia Bufoni'];

let insertY = ['the skate park', 'the X Games', 'the Street League Skateboarding'];

let insertZ = ['boned a beautiful kick flip','landed a 360 heelflip melon','landed primo and took a slam'];


randomize.addEventListener('click', result);

function result() {

    let newStory = storyText;
    const xItem = randomValueFromArray(insertX);
    const yItem = randomValueFromArray(insertY);
    const zItem = randomValueFromArray(insertZ);

    newStory = newStory.replace(':insertx:', xItem);
    newStory = newStory.replace(':inserty:', yItem);
    newStory = newStory.replace(':insertz:', zItem);
    newStory = newStory.replace(':insertx:', xItem);

  if(customName.value !== '') {
    const name = customName.value;
    newStory = newStory.replace('Bob', name);
  }

  if(document.getElementById("uk").checked) {
    const weight = Math.round(300/14);
    const temperature =  Math.round((94-32)/(9/5));
    newStory = newStory.replace('94 fahrenheit', temperature + ' centigrade');
    newStory = newStory.replace('300 pounds', weight + ' stone');
  }
  

  story.textContent = newStory;
  story.style.visibility = 'visible';
}