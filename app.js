/*module that handles budget data: budgetController*/

/* - an IIFE that'll return an object. Within an IIFE has data privacy, inaccessible in the outside scope.
- the module pattern returns an object, containing all of the functions that we want public: 
    functions that we want the outside scope to have access to. */
var budgetController = (function() {
    
    // function constructor for expense 'class'
    var Expense = function(id, description, value) {
        
        this.id = id;
        this.description = description;
        this.value = value;   
        this.percentage = -1;
    }
    
    //calculates percentage (mutator)
    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value/totalIncome)*100);
        } else {
            this.percentage = -1;
        }
    }
    
    //gets percentage (accessor)
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }
    
    var Income = function(id, description, value) {
        
        this.id = id;
        this.description = description;
        this.value = value;   
    }
    
    var data = {
        allItems: {
            exp: new Array(),
            inc: new Array()
        },
        
        totals: {
            exp: 0,
            inc: 0
        },
        
        //income - expenses
        budget: 0,
        percentage: -1
    }
    
    // sum all items in either allItems.exp or allItems.inc, update data.totals
    var calculateTotal = function(type) {
        
        var sum = 0;
        
        //use the type argument in [] to select whether exp or inc
        //forEach allows a callback function to have current element, current index, and overall array
        data.allItems[type].forEach(function(current) {
            sum += current.value; //sums values of the whole array, from this.value (numerical)
        });
        
        //this updates the total of either income or expenses
        data.totals[type] = sum;
        
    }
    
    return {
        //include type (inc, exp), description, and value.
        addItem: function(type, description, value) {
            
            var ID;
            /*a unique number we assign to each new item in either expense or income arrays;
             ID = last ID + 1
             this ID is unique within an array (inc and exp)
             but not unique in different arrays (inc and exp)
             access id of last object, then add one to it (new ID)
            */
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length-1].id + 1;
            } else {
                ID = 0;
            }
            
            //check type of data, push into respective array
            if (type === 'exp') {
                
                var expense = new Expense(ID, description, value);
                data.allItems.exp.push(expense);
                return expense; //we return this, so that controller has access to this object we created.
                
            } else {
                
                var income = new Income(ID, description, value);
                data.allItems.inc.push(income);
                return income;
            }
        },
        
        //remove an item from the exp or inc array depending on type and id
        deleteItem: function(type, id){
            
            //alternatively use a for loop but this uses javascript syntax.
            
            var idArray, index;
            //access to current element, current index, and entire array in callback fn
            idArray = data.allItems[type].map(function(current) {
                return current.id;
            });
            
            //this returns the index in the idArray that matches what is required; so we know which element to splice
            index = idArray.indexOf(id);
            
            if (index !== -1) {
                //splice(indexPosition, number of items to delete)
                data.allItems[type].splice(index, 1);
            }
        },
        
        //we'd like to update the totals object within the data object
        calculateBudget: function() {
            
            // calculate total income, total expenses, and total budget: one minus the other
            //and also update the totals object under budgetController.data
            calculateTotal('exp'); calculateTotal('inc');
            
            //update the budget value 
            data.budget = data.totals.inc - data.totals.exp;
            
            //we'll get an infinity value if we put in an expense and no income...
            //since the percentage would be division by 0.
            
            if (data.totals.inc > 0) {
            //calculate the percentage of income that our expenses are.
            data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
            
        },
        
        //updates percentage for each object
        calculatePercentages: function() {
            //calculate expense percentage as a fraction of income, for each object in expense array
            data.allItems.exp.forEach(function (current) {
                //updates percentage of an object
                current.calcPercentage(data.totals.inc);
            });
        },
        
        //return an array of all the percentages
        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            })
            return allPercentages;
        },
        
        //so we can use this in the controller, to pass onto UIController
        getBudget: function() {
            return {
                totalIncome: data.totals.inc,
                totalExpenses: data.totals.exp,
                budget: data.budget,
                percentage: data.percentage
            }
        },
        
        
        testing: function() {
            console.log(data);
        }
    }
    
})();



var UIController = (function() {
    
    /* The purpose of this, is if someone changes class names in html, we don't need to change 
    every instance of that name in js. Just need to change it once, right here. */
    var DOMstrings = {
        
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        inputKey: '.add__key',
        //element we select if we want to append the new item's html to income__list
        incomeContainer: '.income__list',
        //element we select if we want to append the new item's html to expenses__list
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
    
    var nodeListForEach = function(nodeList, callbackFn) {
                //for loop that iterates through and call the callbackFn in each iteration
                for (var i = 0; i < nodeList.length; i++) {
                    callbackFn(nodeList[i], i);
                }
    }
    
    return {
        //extract field's input data
        
        getInput: function() {
        
            //we need to send these info to controller, so give an object with these values
            return {
                //type receives either inc or exp        
                type: document.querySelector(DOMstrings.inputType).value,

                //this holds the string that user types in
                description: document.querySelector(DOMstrings.inputDescription).value,

                //this holds the numerical (money) the user types in; need parseFloat 
                //to convert from string to number
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        
        //actually update the UI
        //this long piece of html is added once for every new income or expense... so index.html can get pretty long
        addListItem: function(object, type) {
            
            var html, newHtml, element;
            // create HTML string with placeholder text
            if(type === "inc") {
                //use element variable to specify which position in index.html we'll insert our html
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
            } else {
                element = DOMstrings.expensesContainer;
                html= '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div></div> </div>';
            }
            
            // replace placeholder text, like %id%, or %value%, with data we receive from object
            newHtml = html.replace('%id%', object.id);
            //operate on the newHtml now, to replace further information 
            newHtml = newHtml.replace('%description%', object.description);
            newHtml = newHtml.replace('%value%', this.formatNumber(object.value, type));
            
            /* insert the HTML into the DOM
               beforeend specifies the position within income_list or expenses_lists' brackets, 
               specifically as the last child of the income_list or expenses_list */
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        
        //delete an item from the UI
        deleteListItem: function(selectorID) {
            //remove an element by using the removeChild method on its parent
            var elementToRemove = document.getElementById(selectorID);
            elementToRemove.parentNode.removeChild(elementToRemove);
        },
        
        //we want to clear all the fields that previously had input in them.
        clearFields: function() {
            var fields, fieldsArray;
            //querySelectorAll, with the specified arguments, returns a NodeList of the selected elements.
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            //fields, a NodeList, 'borrows' the slice function from Arrays, which converts fields into an array
            fieldsArray = Array.prototype.slice.call(fields);
            
            //callback function would be applied for Each element of the array
            //current element, current index, and the fields array..?
            fieldsArray.forEach(function(current, index, array) {
                //this'd set the value of current description and numerical value to empty string.
                current.value = "";
            });
            
            //set focus to first element of array, which is to reset focus to description box
            fieldsArray[0].focus();
        },
        
        displayBudget: function(object) {
            
            var type;
            object.budget > 0 ? type = 'inc' : type = 'exp';
            
            //select a DOM element, set its text content to a new value.
            document.querySelector(DOMstrings.budgetLabel).textContent = this.formatNumber(object.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = this.formatNumber(object.totalIncome, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = this.formatNumber(object.totalExpenses, 'exp');
            document.querySelector(DOMstrings.percentageLabel).textContent = object.percentage;
            
            if (object.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = object.percentage + '%';
            } else {
                
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },
        
        //using the percentages array received, update the UI's percentages display
        displayPercentages: function(percentages) {
            //loop through all of these nodes and change the textcontent % for each of them.
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            
            nodeListForEach(fields, function(current, index) {
                
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
                
            });
        },
        
        //string manipulation to format decimal point, decimal digits, and comma placement
        formatNumber: function(number, type) {
            var numSplit, int, dec, sign;
            // plus or minus before the number
            
            // exactly two decimal points
            
            //comma separating the thousands
            
            number = Math.abs(number);
            number = number.toFixed(2); //set to 2 decimal places for all values, and now num is a string
            numSplit = number.split('.');
            int = numSplit[0]; //the part before . so the integer portion
            if (int.length > 3) {
                //comma placement is between the last 3 digits and any overflow beyond
                int = int.substr(0, int.length - 3) + ',' + int.substr(int.length-3, 3);
            }
            
            dec = numSplit[1]; //the part after . so the decimal portion
            
            type === 'exp' ? sign = '-' : sign = '+';
            
            return (sign + ' ' + int + '.' + dec);
        },
        
        //displays current month of the year
        displayMonth: function() {
            
            var now, year, month, months;
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            
            now = new Date(); //returns an object of the date of today
            month = now.getMonth();
            year = now.getFullYear(); //return 2019
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
            
        },
        
        //change type
        changedType: function() {
            
            //the ones that'll receive the red focus class
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' + DOMstrings.inputDescription + ',' + DOMstrings.inputValue            
            );    
            
            //for the relevenat input fields, toggle whether or not we want the red-focus css class there or not.
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            })
            
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },
        
        //for the controller to access the input types in UI
        getDOMStrings: function() {
            return DOMstrings;
        }
    }
    
})();



/* Pass the other controllers in as arguments, since this controller will manipulate them. */
var controller = (function(budgetCtrl, UICtrl) {

    //a function in which all our event listeners will be placed. 
    var setupEventListeners = function() { 
        
        //to have access to the DOM strings
        var DOM = UICtrl.getDOMStrings();
        
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        /* we don't specify the argument 'event' ourselves; when there's a keypress, this argument
           is passed in automatically.
           @param event: is an object with many properties and methods. 
           */
        document.addEventListener(DOM.inputKey, function(event) {

            //when pressing 'return' key...
            if (event.keyCode == 13) ctrlAddItem(); 
            else {}
        });
        
        //events bubble up, so let container, which is parent of both income and expense, listen for deletion clicks.
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    }
    
    /* This runs everytime the income and expenses arrays may be updated;
    we then need to update the total budget, the total expenses and incomes.
    1. We want budget controller to: Calculate the new budget
       2. Give the budget as an object to controller
       3. Pass this budget object into the UI so we can display it
    */
    var updateBudget = function() {
        budgetCtrl.calculateBudget();
        var budget = budgetCtrl.getBudget();
        UICtrl.displayBudget(budget);
        
    }
    
    var updatePercentages = function() {
        
        // 1. calculate percentages
        budgetCtrl.calculatePercentages();
        
        // 2. read percentages from budget controller
        var percentages = budgetCtrl.getPercentages();
        
        // 3. update user interface, pass the array of percentages to UIController
        UICtrl.displayPercentages(percentages);
    }
    
    
    /* 1. extract field's input data
       2. send the data to budgetController
       3. add this item to user interface
    */
    var ctrlAddItem = function() {
        
        var input, newItem;
        
        //holds the user input data in an object
        input = UICtrl.getInput();
        
        //isNaN tests whether input value IS a number; if it is, evaluates to true.
        //run the function only if there is real data being input.
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            //add an object of type either inc or exp, to the budgetCtrl 'data.allItems' array
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
        
            //updating the .bottom portion of visual UI
            UICtrl.addListItem(newItem, input.type);
        
            //clear the fields in UI after adding new element
            UICtrl.clearFields(); 
        
            //calculate and update budget
            updateBudget();
            
            //6. calculate and update percentages
            updatePercentages();
            
        }
    }
    
    /* we need to pass in the event... addEventListener's callback function always has access to event object */
    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        
        //we need to find out which element has its delete icon pressed; this is why we had ID:
        //by traversing up the DOM tree, from the targetElement of close-button being pressed (e.g. line 65) 
        //we'll reach the parent containing the id, so we'll know which element we're trying to delete.
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        //if itemID is actually defined then we run this code...
        if(itemID) {
            
            //need to split a string, like inc-1, into type: inc and id: 1
            //returns an array where first element is what's before dash, second element is what's after dash
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
            
            //now we can index into the right array, and pop that element.
            /* Delete item from the data structure (create a function for this)
               Delete the item from the user interface (create a method)
               Update to show the new totals. (another method) */
            budgetCtrl.deleteItem(type, ID);
            
            //remove element from ID
            UICtrl.deleteListItem(itemID);
            
            //calculate and update budget
            updateBudget();
            
            updatePercentages();
        }
    }
    
    return {
        
        //all the code that runs right when application starts.
        init: function() {
            
            UICtrl.displayMonth();
            //we call displayBudget here right in the beginning, setting everything to 0.
            UICtrl.displayBudget({
                totalIncome: 0,
                totalExpenses: 0,
                budget: 0,
                percentage: -1
            });
            setupEventListeners();        
        }
    }
    
})(budgetController, UIController);

//nothing is ever going to happen without this, because no event listeners. 
controller.init();