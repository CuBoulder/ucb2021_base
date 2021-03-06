/* naughty global variables!!! */
let Departments = {} // translate table for department id => department name
let JobTypes = {} // translate table for type id => type name
let ourPepole = {} // all of the pepole that match our filter 
let renderedTable = 0;  // flag to know if we've rendered the table header or not yet
let firstPassCount = 0; // count for the first pass per group.  

/**
 * Helper function to toggle show hide on an element 
 * @param {string} id // element id to toggle
 * @param {string} display // value to change it to (block | none)
 */
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

/**
 * Helper function to load the data for a taxonomy from the JSON:API endpoint 
 * we need this to get the human-friendly names of the items in this vocabulary
 * @param {string} taxonomyName // Drupal machine name of the taxonomy to retrieve 
 * @returns Promise with resolve or reject 
 */
function getTaxonomy(taxonomyName) {
  return new Promise(function (resolve, reject) {
    if (taxonomyName) {
      let result = [] 
      let taxonomyURL = `/jsonapi/taxonomy_term/${taxonomyName}?sort=weight,name`

      fetch(taxonomyURL)
        .then((response) => response.json())
        .then((data) => {
          // console.log("Taxonomy Object : ", data)
          data.data.map((attributes) => {
            let id = attributes.attributes.drupal_internal__tid
            let name = attributes.attributes.name
            let thisTerm = {}

            thisTerm['id'] = id
            thisTerm['name'] = name
            result.push(thisTerm) 
          })

          resolve(result)
        })
    } else {
      // no taxonomy term to load
      reject
    }
  })
}

/**
 * Find the taxonomy that matches the id ... makes it easier to retrieve the name
 * @param {*} taxonomy // taxonomy vocab to searh 
 * @param {*} tid // id to find in the array of hashes
 * @returns hash {{ name => "name", id => "id"}}
 */
function getTaxonomyName(taxonomy, tid) {
  return taxonomy.find( ({ id }) => id === tid );
}

/**
 * Main function to get People nodes based on the JSON:API URL  
 * @param {string} JSONAPI // JSON:API enpoint URL with required filters and sorts
 * @returns Promise with resolve or reject
 */
function getStaff(JSONAPI) {
  return new Promise(function (resolve, reject) {
    if (JSONAPI) {
      fetch(JSONAPI)
        .then((response) => response.json())
        .then((data) => {
          console.log("Person Data is : ", data)
          if(data.data.length === 0) {
            console.log("No people matching the filter returned.")
            toggleMessage('ucb-al-end-of-data', 'block')
          }
          resolve(data)
        })
    } else {
      toggleMessage('ucb-al-error', 'block')
      reject
    }
  })
}

/**
 * Each Format needs a different parent element before people can be inserted
 * this function ensures the correct parent wrapper element is created for data
 * @param {string} Format // display format in use (grid | list | table) 
 * @returns document.elment 
 */
function getParentContainer(Format) {
  let container = ''
  switch (Format) {
    case 'list':
      break
    case 'grid':
      container = document.getElementById('ucb-pl-content')
      container.classList = "row ucb-people-list-content"
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

/**
 * Function to render the indivdual person card in the correct format  
 * @param {string} Format // display format (grid | list | table)
 * @param {object} Person // person object containing the content to render the card
 * @returns HTML string to be rendered
 */
function displayPersonCard(Format, Person) {
  // console.log('Rendering the card for ' + Person.Name)
  let cardHTML = ''
  // grab the friendly name from the global variable
  // note: there may be a race condidtion here as we're also querying
  //  to get those friendly names from the API endpoint.
  // console.log('Departments :', Departments)
  let myDept = ""
  for(let i = 0; i < Person.Dept.length; i++) {
    let thisDeptID = Person.Dept[i]
    let thisDeptName = getTaxonomyName(Departments, thisDeptID).name;
    myDept += `<li>${thisDeptName}</li>`
  }
  let myPhoto = ''
  if (Person.PhotoURL) {
    myPhoto = `<img src="${Person.PhotoURL}"  />`
  }

  switch (Format) {
    case 'list':
      cardHTML = `
                <div class="ucb-person-card-list row">
                    <div class="col-sm-12 col-md-3 ucb-person-card-img">
                        <a href="${Person.Link}">${myPhoto}</a>
                    </div>
                    <div class="col-sm-12 col-md-9 ucb-person-card-details">
                        <a href="${Person.Link}">
                            <span class="ucb-person-card-name">
                                ${Person.Name ? Person.Name : ''}
                            </span>
                        </a>
                        <span class="ucb-person-card-title">
                            ${Person.Title ? Person.Title : ''}
                        </span>
                    <span class="ucb-person-card-dept">
                      <ul class="ucb-person-card-dept-ul">
                        ${myDept} 
                      </ul>
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
                        <a href="${Person.Link}">${myPhoto}</a>
                    </div>
                <div>
                <a href="${Person.Link}">
                            <span class="ucb-person-card-name">
                                ${Person.Name ? Person.Name : ''}
                            </span>
                        </a>
                <span class="ucb-person-card-title departments-grid">
                  ${Person.Title ? Person.Title : ''}
                </span>
                <span class="ucb-person-card-dept departments-grid">
                  <ul class="ucb-person-card-dept-ul">
                   ${myDept}
                  </ul>
                 </span>
                </div>
                </div>
        `
      break
    case 'table':
      cardHTML = `

                  <td class="ucb-people-list-table-photo">
                    <a href="${Person.Link}">${myPhoto}</a>  
                  </td>
                  <td>
                    <a href="${Person.Link}">
                      <span class="ucb-person-card-name">
                        ${Person.Name ? Person.Name : ''}
                      </span>
                    </a>
                    <span class="ucb-person-card-title departments-grid">
                  ${Person.Title ? Person.Title : ''}
                </span>
                <span class="ucb-person-card-dept departments-grid">
                  <ul class="ucb-person-card-dept-ul">
                   ${myDept}
                  </ul>
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

/**
 * Main function to display a collection of people in a given format in the group identified
 * by groupID 
 * @param {string} DISPLAYFORMAT // format to use (grid | list | table)
 * @param {string} GROUPBY // which taxonomy to group people in (department | type | none)
 * @param {string} groupID // which department or type we're currently working on rendering
 * @param {string} ORDERBY // do we sort the current group by last or type+last 
 */
function displayPeople(DISPLAYFORMAT, GROUPBY, groupID, ORDERBY) {
  let renderThisGroup = 0; 
  let el = document.getElementById('ucb-people-list-page')
  let thisDeptName = ""
  let thisTypeName = ""
  if(GROUPBY === "department") {
    thisDeptName = getTaxonomyName(Departments, groupID).name
  } else if(GROUPBY === "type") {
    thisTypeName = getTaxonomyName(JobTypes, groupID).name
  }
  // el.classList = 'container'
  // let headerHTML = layoutHeader(DISPLAYFORMAT)
  // let footerHTML = layoutFooter(DISPLAYFORMAT)
  let parentContainer = getParentContainer(DISPLAYFORMAT)

  // TO DO -- issue here with header adding correctly to grid
  if (DISPLAYFORMAT === 'grid' || DISPLAYFORMAT === 'table') {
    el.appendChild(parentContainer)
  }

  // if this is our second pass on rendering content we don't need a group-by title 
  // we also don't some of the opening DOM elements before the card info.  
  if(ORDERBY === "secondpass" && firstPassCount) {
    renderThisGroup++;
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
        urlObj[pair.id] = pair.links.focal_image.href
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
      let renderMe = true;
      let thisPerson = {}
      let thisPersonCard = '' // placeholder for the HTML to render this card in the required format
      thisPerson['Name'] = person.attributes.title
      thisPerson['Title'] = person.attributes.field_ucb_person_title[0]
      thisPerson['Dept'] = []
      for(let i = 0; i < person.relationships.field_ucb_person_department.data.length; i++) {
        thisPerson['Dept'].push(
          person.relationships.field_ucb_person_department.data[i].meta.drupal_internal__target_id
        );
      } 
      thisPerson['Jobtype'] = []
      for(let i = 0; i < person.relationships.field_ucb_person_job_type.data.length; i++) {
        thisPerson['Jobtype'].push(
          person.relationships.field_ucb_person_job_type.data[i].meta.drupal_internal__target_id
        );
      }
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

      // if first pass (sort by type first) then only render the people with a Job Type 
      // else if second pass (sort by type first) then only render the people without a Job Type
      if(ORDERBY === "firstpass" && !thisPerson['Jobtype'].length) {
        renderMe = false;
      } else if(ORDERBY === "secondpass" && thisPerson['Jobtype'].length) {
        renderMe = false;
      }

      // check to see if this person needs to be rendered 
      if(renderMe) {


      // check to see if we need to filter based on a group by seeting
      // and if so that this person matches our groupID
      if ((!GROUPBY || !groupID) || (thisPerson['Dept'].find(deptid => deptid == groupID) || thisPerson['Jobtype'].find(typeid => typeid == groupID))) {
        //console.log( "I'm a match! " + groupID + ' = ' + thisPerson['Dept'] + ' or ' + thisPerson['Jobtype'],)

        // increment flags for rendering in this group as necessary
        renderThisGroup++; 
        if(ORDERBY === "firstpass") {
          firstPassCount++;
        }

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
            // we may be on a second pass and have already rendered the title in the first pass
            // if so, skip the title so we don't end up with two 
            // console.log("First Pass Count is : " + firstPassCount)
            // console.log("Render pass is : " + ORDERBY)
            if((ORDERBY === "secondpass" && !firstPassCount) || ORDERBY != "secondpass") {
              let GroupTitle = document.createElement('div');
              GroupTitle.innerHTML = ` 
                <h2>${GROUPBY == 'type' ? thisTypeName : thisDeptName}</h2>`
              el.appendChild(GroupTitle);
            }
          }

          el.appendChild(thisCard)
        } else if (DISPLAYFORMAT === 'grid') {

          // check to see if this is the first time we're adding in a member of this group
          // if so, add the name of the group first 
          if(renderThisGroup === 1 && groupID) {
            // we may be on a second pass and have already rendered the title in the first pass
            // if so, skip the title so we don't end up with two 
            if((ORDERBY === "secondpass" && !firstPassCount) || ORDERBY != "secondpass") {
              let GroupTitle = document.createElement('div');
              GroupTitle.classList = "col-12";
              GroupTitle.innerHTML = `<h2>${GROUPBY == 'type' ? thisTypeName : thisDeptName}</h2>`
              parentContainer.appendChild(GroupTitle)
            }
          }

          thisCard.classList = 'col-sm-12 col-md-6 col-lg-4'
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
            // we may be on a second pass and have already rendered the title in the first pass
            // if so, skip the title so we don't end up with two 
            if((ORDERBY === "secondpass" && !firstPassCount) || ORDERBY != "secondpass") {
              let GroupTitle = document.createElement('tr');
              let GroupTitleHTML = `
                <th colspan="3" class="ucb-people-list-group-title-th">
                ${GROUPBY == 'type' ? thisTypeName : thisDeptName}
                </th>
                `
              GroupTitle.innerHTML = GroupTitleHTML;
              tablebody.appendChild(GroupTitle);
            }
          }
          
          tablebody.appendChild(thisCard)
        }
      } else {
        // console.log( 'Not a match! ' + groupID + ' != ' + thisPerson['Dept'] + ' or ' + thisPerson['Jobtype'],);
      }
    }
    })
  } else {
    console.log('empty staff object, no people to render ', ourPepole)
    toggleMessage('ucb-al-end-of-data', 'block')
  }
  // done with cards, clean up and close any HTML tags we have opened.
  // el.append(footerHTML)

  // console.log(el.dataset.json)
}

// INIT
(function () {
  let el = document.getElementById('ucb-people-list-page')
  let JSONAPI = el.dataset.json ? el.dataset.json : ''
  let FORMAT = el.dataset.format ? el.dataset.format : ''
  let GROUPBY = el.dataset.groupby ? el.dataset.groupby : ''
  let ORDERBY = el.dataset.orderby ? el.dataset.orderby : ''
  // console.log('Init')
  // console.log("Order by is : " + ORDERBY)

  getTaxonomy('department').then((response) => {
    Departments = response
    // console.log('Our Departments are : ', Departments);
  })

  getTaxonomy('ucb_person_job_type').then((response) => {
    JobTypes = response
    // console.log('Our Job types are : ', JobTypes);
  })

  toggleMessage('ucb-al-loading', 'block')

  getStaff(JSONAPI)
    .then((response) => {
      ourPepole = response
    })
    .then(() => {
      toggleMessage('ucb-al-loading', 'none')
      if (GROUPBY == 'department') {
        for (const [key] of Object.entries(Departments)) {
          // let thisDeptID = Departments[key].id
          // let thisDeptName = getTaxonomyName(Departments, thisDeptID);
          // console.log("Group by Dept : " + thisDeptID)
          // console.log("Group by Dept : " + thisDeptName.name)

          if(ORDERBY === "type") {
            firstPassCount = 0; 
            displayPeople(FORMAT, GROUPBY, Departments[key].id, "firstpass")
            displayPeople(FORMAT, GROUPBY, Departments[key].id, "secondpass")
          }else {
            displayPeople(FORMAT, GROUPBY, Departments[key].id, "")
          }
        }
      } else if (GROUPBY == 'type') {
        for (const [key] of Object.entries(JobTypes)) {
          // let thisTypeID = JobTypes[key].id
          // let thisTypeName = getTaxonomyName(JobTypes, thisTypeID) 
          // console.log("Group by Type : " + thisTypeID)
          // console.log("Group by Name : " + thisTypeName.name)
          if(ORDERBY === "type") {
            firstPassCount = 0; 
            displayPeople(FORMAT, GROUPBY, JobTypes[key].id, "firstpass")
            displayPeople(FORMAT, GROUPBY, JobTypes[key].id, "secondpass")
          }else {
            displayPeople(FORMAT, GROUPBY, JobTypes[key].id, "")
          }
        }
      } else {
        if(ORDERBY === "type") {
          firstPassCount = 0; 
          displayPeople(FORMAT, "", "", "firstpass")
          displayPeople(FORMAT, "", "", "secondpass")
        }else {
          displayPeople(FORMAT, "", "", "")
        }
      }
    })
})()