// just preventing empty inputs in review/search/filter
// in the off chance that someone submits an empty field
// before this script can disable the corresponding button,
// there are error messages to handle it

// review submit
function openModal() {
    var review = document.getElementById("review");
    var review_button = document.getElementById("submit_review");

    review.onkeyup = function() {

        if (review.value) {
            review_button.disabled = false;
        }
        else{
            review_button.disabled = true;
        }
        
    }
}

// tv show search
var search = document.getElementById("search");
var search_button = document.getElementById("search_button");
search.onkeyup = function() {
    if (search.value) {
        search_button.disabled = false;
    }
    else {
        search_button.disabled = true;
    }
}

// review filter
var filter = document.getElementById("filter");
var filter_button = document.getElementById("filter_button");
filter.onkeyup = function() {
    if (filter.value) {
        filter_button.disabled = false;
    }
    else {
        filter_button.disabled = true;
    }
}