
function getTaxonomy(taxonomyName) {
    return new Promise(function(resolve, reject) {
        if(taxonomyName) {
            let result = {};
            let taxonomyURL = `/jsonapi/taxonomy_term/${taxonomyName}`;

            fetch(taxonomyURL)
                .then((response) => response.json())
                .then((data) => {

                    data.data.map((attributes) => {
                        let key = attributes.attributes.drupal_internal__tid;
                        let value = attributes.attributes.name;

                        result[key] = value;
                    });

                resolve(result);
            });
        }else {
            // no taxonomy term to load
            reject;
        }
    });
}

function layoutHeader(Format) {
    let displayHTML = "";
    switch(Format) {
        case "list": 
            break;
        case "grid":
            displayHTML = `<div class="ucb-people-list-grid row">`
            break;
        case "table":
            displayHTML = `
                <table>
                <thead>
                <tr>
                    <th class="sr-only">Photo</th>
                    <th>Name</th>
                    <th>Contact Information</th>
                </tr>
                </thead>
                <tbody>
            `
            break;
        default:
    }

    return displayHTML;
}

function layoutFooter(Format) {
    let displayHTML = "";
    switch(Format) {
        case "list": 
            break;
        case "grid":
            displayHTML = "</div>"
            break;
        case "table":
            displayHTML = "</tbody></table>"
            break;
        default:
    }

    return displayHTML;
}

function displayPersonCard(Format, Person) {
    console.log("Rendering the card for " + Person.Name);
}

function displayPeople(JSONURL, DISPLAYFORMAT) {
console.log(JSONURL);
let el = document.getElementById('ucb-people-list-page');
let headerHTML = layoutHeader(DISPLAYFORMAT);
let footerHTML = layoutFooter(DISPLAYFORMAT);

el.append(headerHTML);

fetch(JSONURL)
  .then((response) => response.json())
  .then((data) => {
    console.log(data) // our data obj
    // maps over data
    data.data.map((person) => {
        // get the person data we need 
        let thisPerson = {};
        thisPerson["Name"]      = person.attributes.title;
        thisPerson["Title"]     = person.attributes.field_ucb_person_title[0];
        thisPerson["Dept"]      = person.relationships.field_ucb_person_department.data[0].meta.drupal_internal__target_id;
        thisPerson["Jobtype"]   = person.relationships.field_ucb_person_job_type.data[0].meta.drupal_internal__target_id;
        thisPerson["PhotoID"]   = person.relationships.field_ucb_person_photo.data.id;
        thisPerson["PhotoURL"]  = "";
        thisPerson["Email"]     = person.attributes.field_ucb_person_email;
        thisPerson["Phone"]     = person.attributes.field_ucb_person_phone;
        thisPerson["Link"]     = person.attributes.path.alias;
        let myBody      = person.attributes.body.processed;
        if(myBody) {
            myBody.replace( /<\/?[^>]+(>|$)/g,""); // strip out HTML characters
            myBody.replace(/(\r\n|\n|\r)/gm, ""); // strip out line breaks
            thisPerson["Body"] = myBody;
        }

        // switch on the given format 
        // display cards in the requested format
    //   let personDiv = document.createElement('div')
    //   personDiv.classList = 'container'
    //   personDiv.innerHTML = `
    //     <div>
    //         <h1>${thisPerson.Name}</h1>
    //         <p>My Job Title: ${thisPerson.Title}</p>
    //         <p>My department : ${thisPerson.Dept}</p>
    //         <p>My photo id: ${thisPerson.PhotoID}</p>
    //         <p>${thisPerson.Email}</p>
    //         <p>${thisPerson.Phone}</p>
    //         <p>Body : ${thisPerson.Body}</p>
    //         <a href=${thisPerson.Link}> Go to my page </a>
    //     </div>
    //   `
    //   //append each completed person div to the DOM
    //   let el = document.getElementById('ucb-people-list-page');
    //   el.appendChild(personDiv)

        displayPersonCard(DISPLAYFORMAT, thisPerson);
    })
  })
  layoutFooter(DISPLAYFORMAT);
// console.log(el.dataset.json)
}

// INIT
(function() { 
    let el = document.getElementById('ucb-people-list-page');
    let JSONAPI = el.dataset.json;
    let FORMAT = el.dataset.format;
    let Departments = {};
    let JobTypes = {};
    console.log("Init");

    if(JSONAPI) {
        displayPeople(JSONAPI, FORMAT);
    }

    getTaxonomy('department').then((response) => {
        Departments = response;
        //console.log('Our Departments are : ', Departments);
    });

    getTaxonomy('ucb_person_job_type').then((response) => {
        JobTypes = response;
        //console.log('Our Job types are : ', JobTypes);
    });


})();
