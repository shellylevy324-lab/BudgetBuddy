// ======================================
// Budget Buddy v0.3
// Main JavaScript File
// ======================================


// ------------------------------
// Screen Navigation
// ------------------------------

function showScreen(screenID) {

    const screens = [
        "homeScreen",
        "teacherScreen",
        "groceryScreen"
    ];


    screens.forEach(function(screen){

        const element = document.getElementById(screen);

        if(element){

            element.classList.add("hidden");

        }

    });


    const selectedScreen =
    document.getElementById(screenID);


    if(selectedScreen){

        selectedScreen.classList.remove("hidden");

    }

}



// ------------------------------
// Home Buttons
// ------------------------------


const startButton =
document.getElementById("startButton");


if(startButton){

    startButton.onclick = function(){

        showScreen("groceryScreen");

        loadGroceryItem();

    };

}




const teacherButton =
document.getElementById("teacherButton");


if(teacherButton){

    teacherButton.onclick = function(){

        showScreen("teacherScreen");

    };

}




// ------------------------------
// Back Buttons
// ------------------------------


const teacherBackButton =
document.getElementById("teacherBackButton");


if(teacherBackButton){

    teacherBackButton.onclick = function(){

        showScreen("homeScreen");

    };

}



const groceryBackButton =
document.getElementById("groceryBackButton");


if(groceryBackButton){

    groceryBackButton.onclick = function(){

        showScreen("homeScreen");

    };

}




// ------------------------------
// Teacher Setup
// ------------------------------


const saveStudent =
document.getElementById("saveStudent");


if(saveStudent){

    saveStudent.onclick = function(){


        const student =
        document.getElementById("studentName").value;


        const prompt =
        document.getElementById("promptStyle").value;


        const wait =
        document.getElementById("waitTime").value;



        console.log("Student:", student);

        console.log("Prompt:", prompt);

        console.log("Wait Time:", wait);



        alert(
            "Student setup saved!"
        );


    };

}




// ------------------------------
// Grocery Loading
// ------------------------------


async function loadGroceryItem(){


    try{


        const response =
        await fetch("data/grocery.json");



        const items =
        await response.json();



        const randomIndex =
        Math.floor(Math.random() * items.length);



        const item =
        items[randomIndex];



        document.getElementById("itemName").innerHTML =
        item.name;



        document.getElementById("itemPrice").innerHTML =
        "$" + Number(item.price).toFixed(2);



        document.getElementById("itemCategory").innerHTML =
        item.category;


    document.getElementById("itemImage").src =
    "assets/images/grocery/" + item.image;
        

    }


    catch(error){


        console.error(
            "Error loading grocery item:",
            error
        );


    }

}




// ------------------------------
// Purchasing Buttons
// ------------------------------


const yesButton =
document.getElementById("yesButton");



if(yesButton){

    yesButton.onclick=function(){

        alert(
            "Great! Let's check if the budget works."
        );

    };

}




const noButton =
document.getElementById("noButton");



if(noButton){

    noButton.onclick=function(){

        alert(
            "Let's practice thinking about cost."
        );

    };

}



console.log(
    "Budget Buddy v0.3 loaded successfully"
);