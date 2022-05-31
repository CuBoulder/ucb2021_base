/* naughty global variables!!! */
let Departments = {}
let JobTypes = {}
let ourPepole = {}
let renderedTable = 0; 

function toggleMessage(id, display = 'none') {
  if (id) {
    var toggle = document.getElementById(id)

    if (toggle) {
      if (display === 'block') {
        toggle.style.display = 'block'
      } else {
        toggle.style.display = 'none'
      }
    }
  }
}

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

function getStaff(JSONAPI) {
  return new Promise(function (resolve, reject) {
    if (JSONAPI) {
      fetch(JSONAPI)
        .then((response) => response.json())
        .then((data) => {
          resolve(data)
        })
    } else {
      reject
    }
  })
}

// function layoutHeader(Format) {
//   let displayHTML = ''
//   switch (Format) {
//     case 'list':
//       break
//     case 'grid':
//       displayHTML = `<div class="ucb-people-list-grid row">`
//       break
//     case 'table':
//       displayHTML = `
//                 <table>
//                   <thead>
//                       <tr>
//                         <th class="sr-only">Photo</th>
//                         <th>Name</th>
//                         <th>Contact Information</th>
//                       </tr>
//                   </thead>
//                 <tbody>
//             `
//       break
//     default:
//   }

//   return displayHTML
// }

// function layoutFooter(Format) {
//   let displayHTML = ''
//   switch (Format) {
//     case 'list':
//       break
//     case 'grid':
//       displayHTML = '</div>'
//       break
//     case 'table':
//       displayHTML = '</tbody></table>'
//       break
//     default:
//   }

//   return displayHTML
// }

// Each Format needs a different parent element before people can be inserted, this function ensures the correct parent wrapper element is created for data
function getParentContainer(Format) {
  let container = ''
  switch (Format) {
    case 'list':
      break
    case 'grid':
      container = document.createElement('div')
      container.classList = 'ucb-people-list-grid row'
      break
    case 'table':
      // we only need to render the table header the first time
      // this function will be called multiple times so check to 
      // see if we've already rendered the table header HTML
      if(!renderedTable) {
      container = document.createElement('table')
      container.id = 'ucb-pl-table'
      container.classList = 'table  table-bordered table-striped'
      tableHead = document.createElement('thead')
      tableHead.classList = 'ucb-people-list-table-head'
      tableRow = document.createElement('tr')
      tableRow.innerHTML = `
            <th><span class="sr-only">Photo</span></th>
            <th>Name</th>
            <th>Contact Information</th>
      `
      tableBody = document.createElement('tbody')
      tableBody.id = 'ucb-people-list-table-tablebody'
      tableHead.appendChild(tableRow)
      container.appendChild(tableHead)
      container.appendChild(tableBody)
      }else {
        container = document.getElementById('ucb-pl-table')
      }
      renderedTable++; 
      break
    default:
  }
  return container
}

function displayPersonCard(Format, Person) {
  console.log('Rendering the card for ' + Person.Name)
  let cardHTML = ''
  // grab the friendly name from the global variable
  // note: there may be a race condidtion here as we're also querying
  //  to get those friendly names from the API endpoint.
  // console.log('Departments :', Departments)
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
                                ? `<a href="mailto:${Person.Email}"><i class="fa fa-envelope people-list-icon"><span class="ucb-people-list-contact">  ${Person.Email}</span></i></a>`
                                : ''
                            }
                        </span>
                        <span class="ucb-person-card-phone">
                            ${
                              Person.Phone
                                ? `<a href="tel:${Person.Phone.replace(
                                    /[^+\d]+/g,
                                    '',
                                  )}"><p><i class="fa fa-phone people-list-icon"><span class="ucb-people-list-contact">  ${
                                    Person.Phone
                                  }</span></i></p></a>`
                                : ''
                            }
                        </span>
                    </div>
                    </div>
                </div>
            `
      break
    case 'grid':
      cardHTML = `
                <div class="col-sm mb-3">
                    <div class="col-sm-12 ucb-person-card-img-grid">
                        <a href="${Person.Link}" target="_blank">${myPhoto}</a>
                    </div>
                <div>
                <a href="${Person.Link}" target="_blank">
                            <span class="ucb-person-card-name">
                                ${Person.Name ? Person.Name : ''}
                            </span>
                        </a>
                <span class="ucb-person-card-title departments-grid">
                  ${Person.Title ? Person.Title : ''}
                </span>
                <span class="ucb-person-card-dept departments-grid">
                   ${myDept}
                 </span>
                </div>
                </div>
        `
      break
    case 'table':
      cardHTML = `

                  <td class="ucb-people-list-table-photo">
                    <a href="${Person.Link}" target="_blank">${myPhoto}</a>  
                  </td>
                  <td>
                    <a href="${Person.Link}" target="_blank">
                      <span class="ucb-person-card-name">
                        ${Person.Name ? Person.Name : ''}
                      </span>
                    </a>
                    <span class="ucb-person-card-title departments-grid">
                  ${Person.Title ? Person.Title : ''}
                </span>
                <span class="ucb-person-card-dept departments-grid">
                   ${myDept}
                 </span>
                  </td>
                  <td>
                  <span class="ucb-person-card-email">
                            ${
                              Person.Email
                                ? `<a href="mailto:${Person.Email}"><i class="fa fa-envelope people-list-icon"><span class="ucb-people-list-contact"> ${Person.Email}</span></i></p></a>`
                                : ''
                            }
                        </span>
                        <span class="ucb-person-card-phone">
                            ${
                              Person.Phone
                                ? `<a href="tel:${Person.Phone.replace(
                                    /[^+\d]+/g,
                                    '',
                                  )}"><p><i class="fa fa-phone people-list-icon">
                                    <span class="ucb-people-list-contact"> 
                                  ${Person.Phone}</span></i></p></a>`
                                : ''
                            }
                        </span>
                  </td>

        `
      break
    default:
  }
  return cardHTML
}

function displayPeople(DISPLAYFORMAT, GROUPBY, groupID) {
  console.log('Group by : ' + GROUPBY)
  console.log('Group ID is : ' + groupID)
  let renderThisGroup = 0; 
  let el = document.getElementById('ucb-people-list-page')
  el.classList = 'container'
  // let headerHTML = layoutHeader(DISPLAYFORMAT)
  // let footerHTML = layoutFooter(DISPLAYFORMAT)
  let parentContainer = getParentContainer(DISPLAYFORMAT)

  // TO DO -- issue here with header adding correctly to grid
  if (DISPLAYFORMAT === 'grid' || DISPLAYFORMAT === 'table') {
    el.appendChild(parentContainer)
  }

  // fetch(JSONURL)
  //   .then((response) => response.json())
  //   .then((data) => {
  //     console.log(data) // our data obj
  if (Object.keys(ourPepole) != 0) {
    // get all of the include images id => url
    let urlObj = {} // key from data.data to key from data.includes
    let idObj = {} // key from data.includes to URL
    // Remove any blanks from our articles before map
    if (ourPepole.included) {
      let filteredData = ourPepole.included.filter((url) => {
        return url.attributes.uri !== undefined
      })
      // creates the urlObj, key: data id, value: url
      filteredData.map((pair) => {
        urlObj[pair.id] = pair.attributes.uri.url
      })

      // removes all other included data besides images in our included media
      let idFilterData = ourPepole.included.filter((item) => {
        return item.type == 'media--image'
      })
      // using the image-only data, creates the idObj =>  key: thumbnail id, value : data id
      idFilterData.map((pair) => {
        idObj[pair.id] = pair.relationships.thumbnail.data.id
      })
    }

    // maps over data
    ourPepole.data.map((person) => {
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
        // console.log('Am I an image URL? : ' + thisPerson.PhotoURL)
      }

      // check to see if we need to filter based on a group by seeting
      // and if so that this person matches our groupID
      if ((!GROUPBY || !groupID) || (groupID == thisPerson['Dept'] || groupID == thisPerson['Jobtype'])) {
        console.log( "I'm a match! " + groupID + ' = ' + thisPerson['Dept'] + ' or ' + thisPerson['Jobtype'],)
        renderThisGroup++; 

        thisPersonCard = displayPersonCard(DISPLAYFORMAT, thisPerson)

        let thisCard
        // Needed to switch types of container for individual person cards => article for grid & list displays, tr for table display
        if (DISPLAYFORMAT === 'table') {
          thisCard = document.createElement('tr')
        } else {
          thisCard = document.createElement('article')
        }

        thisCard.innerHTML = thisPersonCard

        // This section apprends the generated cards for each respective display type
        if (DISPLAYFORMAT === 'list') {
          // check to see if this is the first time we're adding in a member of this group
          // if so, add the name of the group first 
          if(renderThisGroup === 1 && groupID) {
            let GroupTitle = document.createElement('div');
            GroupTitle.innerHTML = ` 
              <h2>${GROUPBY == 'type' ? JobTypes[groupID] : Departments[groupID]}</h2>`
            el.appendChild(GroupTitle);
          }

          el.appendChild(thisCard)
        } else if (DISPLAYFORMAT === 'grid') {

          // check to see if this is the first time we're adding in a member of this group
          // if so, add the name of the group first 
          if(renderThisGroup === 1 && groupID) {
            let GroupTitle = document.createElement('div');
            GroupTitle.classList = "col-12";
            GroupTitle.innerHTML = `<h2>${GROUPBY == 'type' ? JobTypes[groupID] : Departments[groupID]}</h2>`
            parentContainer.appendChild(GroupTitle)
          }

          thisCard.classList = 'col-sm-4'
          thisCard.innerHTML = thisPersonCard

          parentContainer.appendChild(thisCard)
        } else {
          // if table display, append to inner tablebody instead of parent element
          let tablebody = document.getElementById(
            'ucb-people-list-table-tablebody',
          )

          // check to see if this is the first time we're adding in a member of this group
          // if so, add the name of the group first 
          if(renderThisGroup === 1 && groupID) { 
            let GroupTitle = document.createElement('tr');
            let GroupTitleHTML = `
              <th colspan="3" class="ucb-people-list-group-title-th">
              ${GROUPBY == 'type' ? JobTypes[groupID] : Departments[groupID]}
              </th>
              `
            GroupTitle.innerHTML = GroupTitleHTML;
            tablebody.appendChild(GroupTitle);
          }
          
          tablebody.appendChild(thisCard)
        }
      } else {
        console.log( 'Not a match! ' + groupID + ' != ' + thisPerson['Dept'] + ' or ' + thisPerson['Jobtype'],);
      }
    })
  } else {
    console.log('empty staff object, no people to render ', ourPepole)
  }
  // done with cards, clean up and close any HTML tags we have opened.
  // el.append(footerHTML)

  // console.log(el.dataset.json)
}

// INIT
;(function () {
  let el = document.getElementById('ucb-people-list-page')
  let JSONAPI = el.dataset.json ? el.dataset.json : ''
  let FORMAT = el.dataset.format ? el.dataset.format : ''
  let GROUPBY = el.dataset.groupby ? el.dataset.groupby : ''
  console.log('Init')

  getTaxonomy('department').then((response) => {
    Departments = response
    //console.log('Our Departments are : ', Departments);
  })

  getTaxonomy('ucb_person_job_type').then((response) => {
    JobTypes = response
    //console.log('Our Job types are : ', JobTypes);
  })

  toggleMessage('ucb-al-loading', 'block')

  getStaff(JSONAPI)
    .then((response) => {
      ourPepole = response
    })
    .then(() => {
      toggleMessage('ucb-al-loading', 'none')
      if (GROUPBY == 'department') {
        for (const [key, value] of Object.entries(Departments)) {
          displayPeople(FORMAT, GROUPBY, key)
        }
      } else if (GROUPBY == 'type') {
        for (const [key, value] of Object.entries(JobTypes)) {
          displayPeople(FORMAT, GROUPBY, key)
        }
      } else {
        displayPeople(FORMAT, '', '')
      }
    })
})()
