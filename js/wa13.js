
const employees = [
  {
    firstName: "Sam",
    department: "Tech",
    designation: "Manager",
    salary: 40000,
    raiseEligible: true,
    wfh: false
  },
  {
    firstName: "Mary",
    department: "Finance",
    designation: "Trainee",
    salary: 18500,
    raiseEligible: true,
    wfh: false
  },
  {
    firstName: "Bill",
    department: "HR",
    designation: "Executive",
    salary: 21200,
    raiseEligible: false,
    wfh: false
  },
  {
    firstName: "Anna",
    department: "Tech",
    designation: "Executive",
    salary: 25600,
    raiseEligible: false,
    wfh: false
  }
];

const companys = [
    {
    companyName: "Tech Stars",
    website: "www.techstars.site",
    employees: employees
    }
]
function displayJSONemployees(){
    var workFromHome = "";
    for (employee of employees){
        if (employee.wfh){
            workFromHome = "work from home.";
        }
        else{
            workFromHome = "work from the office.";
        }

        console.log(employee.firstName + " is a " + employee.department + " " + employee.designation + " making " + employee.salary + " a year.");
    }
}
function displayJSONwfh(){
    for (employee of employees){
        if (employee.wfh){
            console.log(employee.firstName + " works from home.");
        }
        else{
            console.log(employee.firstName + " works from the office.");
        }
    }

}

function displayJSONcompany(){
    for (company of companys){
        console.log(company.companyName + " has a website at " + company.website);
    }
}

function totalSalary(employees){
    let total = 0;
    for (employee of employees){
        total += employee.salary;
    }
    console.log("Total Salary - " + total);
    return total;
}

function eligibleForRaise(employees){
    for (employee of employees){
        if (employee.raiseEligible){
            employee.raiseEligible = false;
            employee.salary *= 1.1;
            console.log(employee.firstName + " is eligible for a raise. Their salary is now " + employee.salary);
        }
    }
}
function workFromHome(employees){
    for (employee of employees){
        if (employee.firstName == "Sam" || employee.firstName == "Anna"){
            employee.wfh = true;
        }
    }
}

displayJSONemployees();
displayJSONcompany();
totalSalary(employees);
eligibleForRaise(employees);
workFromHome(employees);
totalSalary(employees);
displayJSONwfh();
