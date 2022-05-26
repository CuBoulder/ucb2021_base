/* naughty global variables!!! */
let Departments = {}
let JobTypes = {}

function getTaxonomy(taxonomyName) {
  return new Promise(function (resolve, reject) {
    if (taxonomyName) {
      let result = {}
      let taxonomyURL = `/jsonapi/taxonomy_term/${taxonomyName}`

      fetch(taxonomyURL)
        .then((response) => response.json())
        .then((data) => {
          data.data.map((attributes) => {
            let key = attributes.attributes.drupal_internal__tid
            let value = attributes.attributes.name

            result[key] = value
          })

          resolve(result)
        })
    } else {
      // no taxonomy term to load
      reject
    }
  })
}

function layoutHeader(Format) {
  let displayHTML = ''
  switch (Format) {
    case 'list':
      break
    case 'grid':
      displayHTML = `<div class="ucb-people-list-grid row">`
      break
    case 'table':
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
      break
    default:
  }

  return displayHTML
}

function layoutFooter(Format) {
  let displayHTML = ''
  switch (Format) {
    case 'list':
      break
    case 'grid':
      displayHTML = '</div>'
      break
    case 'table':
      displayHTML = '</tbody></table>'
      break
    default:
  }

  return displayHTML
}

function displayPersonCard(Format, Person) {
  console.log('Rendering the card for ' + Person.Name)
  let cardHTML = ''
  // grab the friendly name from the global variable
  // note: there may be a race condidtion here as we're also querying
  //  to get those friendly names from the API endpoint.
  let myDept = Person.Dept ? Departments[Person.Dept] : ''
  let myPhoto = ''
  if (Person.PhotoURL) {
    myPhoto = `<img src="${Person.PhotoURL}"  />`
  }

  switch (Format) {
    case 'list':
      cardHTML = `
                <div class="ucb-person-card-list row">
                    <div class="col-sm-12 col-md-3 ucb-person-card-img">
                        <a href="${Person.Link}" target="_blank">${myPhoto}</a>
                    </div>
                    <div class="col-sm-12 col-md-9 ucb-person-card-details">
                        <a href="${Person.Link}" target="_blank">
                            <span class="ucb-person-card-name">
                                ${Person.Name ? Person.Name : ''}
                            </span>
                        </a>
                        <span class="ucb-person-card-title">
                            ${Person.Title ? Person.Title : ''}
                        </span>
                    <span class="ucb-person-card-dept">
                        ${myDept} 
                    </span>
                    <span class="ucb-person-card-body">
                        ${Person.Body ? Person.Body : ''}
                    </span>
                    <div class="ucb-person-card-contact">
                        <span class="ucb-person-card-email">
                            ${
                              Person.Email
                                ? `<a href="mailto:${Person.Email}"><p><i class="fa fa-envelope">${Person.Email}</i></p></a>`
                                : ''
                            }
                        </span>
                        <span class="ucb-person-card-phone">
                            ${
                              Person.Phone
                                ? `<a href="tel:${Person.Phone.replace(
                                    /[^+\d]+/g,
                                    '',
                                  )}"><p><i class="fa fa-phone">${
                                    Person.Phone
                                  }</i></p></a>`
                                : ''
                            }
                        </span>
                    </div>
                    </div>
                </div>
            `
      break
    case 'grid':
      break
    case 'table':
      break
    default:
  }
  return cardHTML
}

function displayPeople(JSONURL, DISPLAYFORMAT) {
  console.log(JSONURL)
  let el = document.getElementById('ucb-people-list-page')
  el.classList = 'container'
  let headerHTML = layoutHeader(DISPLAYFORMAT)
  let footerHTML = layoutFooter(DISPLAYFORMAT)

  el.append(headerHTML)

  fetch(JSONURL)
    .then((response) => response.json())
    .then((data) => {
      console.log(data) // our data obj

      // get all of the include images id => url
      let urlObj = {} // key from data.data to key from data.includes
      let idObj = {} // key from data.includes to URL
      // Remove any blanks from our articles before map
      if (data.included) {
        let filteredData = data.included.filter((url) => {
          return url.attributes.uri !== undefined
        })
        // creates the urlObj, key: data id, value: url
        filteredData.map((pair) => {
          urlObj[pair.id] = pair.attributes.uri.url
        })

        // removes all other included data besides images in our included media
        let idFilterData = data.included.filter((item) => {
          return item.type == 'media--image'
        })
        // using the image-only data, creates the idObj =>  key: thumbnail id, value : data id
        idFilterData.map((pair) => {
          idObj[pair.id] = pair.relationships.thumbnail.data.id
        })
      }

      // maps over data
      data.data.map((person) => {
        // get the person data we need
        let thisPerson = {}
        let thisPersonCard = '' // placeholder for the HTML to render this card in the required format
        thisPerson['Name'] = person.attributes.title
        thisPerson['Title'] = person.attributes.field_ucb_person_title[0]
        thisPerson['Dept'] =
          person.relationships.field_ucb_person_department.data[0].meta.drupal_internal__target_id
        thisPerson['Jobtype'] =
          person.relationships.field_ucb_person_job_type.data[0].meta.drupal_internal__target_id
        thisPerson['PhotoID'] =
          person.relationships.field_ucb_person_photo.data.id
        thisPerson['PhotoURL'] = ''
        thisPerson['Email'] = person.attributes.field_ucb_person_email
        thisPerson['Phone'] = person.attributes.field_ucb_person_phone
        thisPerson['Link'] = person.attributes.path.alias
        // needed to verify body exists on the Person page, if so, use that
        if (person.attributes.body) {
          myBody = person.attributes.body.processed
          myBody.replace(/<\/?[^>]+(>|$)/g, '') // strip out HTML characters
          myBody.replace(/(\r\n|\n|\r)/gm, '') // strip out line breaks
          thisPerson['Body'] = myBody
        } else {
          // if no body, set to empty
          thisPerson['Body'] = ''
        }
        if (thisPerson.PhotoID) {
          thisPerson['PhotoURL'] = urlObj[idObj[thisPerson.PhotoID]]
          console.log('Am I an image URL? : ' + thisPerson.PhotoURL)
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

        thisPersonCard = displayPersonCard(DISPLAYFORMAT, thisPerson)
        let thisCard = document.createElement('article')
        thisCard.innerHTML = thisPersonCard

        el.appendChild(thisCard)
      })
    })

  // done with cards, clean up and close any HTML tags we have opened.
  el.append(footerHTML)

  // console.log(el.dataset.json)
}

// INIT
;(function () {
  let el = document.getElementById('ucb-people-list-page')
  let JSONAPI = el.dataset.json
  let FORMAT = el.dataset.format
  console.log('Init')

  if (JSONAPI) {
    displayPeople(JSONAPI, FORMAT)
  }

  getTaxonomy('department').then((response) => {
    Departments = response
    //console.log('Our Departments are : ', Departments);
  })

  getTaxonomy('ucb_person_job_type').then((response) => {
    JobTypes = response
    //console.log('Our Job types are : ', JobTypes);
  })
})()
