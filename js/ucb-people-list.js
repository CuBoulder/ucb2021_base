let el = document.getElementById('ucb-people-list-page')
let JSONAPI = el.dataset.json
console.log(JSONAPI)

fetch(JSONAPI)
  .then((response) => response.json())
  .then((data) => {
    console.log(data) // our data obj
    // maps over data
    data.data.map((person) => {
      let personDiv = document.createElement('div')
      personDiv.classList = 'container'
      personDiv.innerHTML = `
        <div>
            <h1>${person.attributes.title}</h1>
            <p>My Job Title: ${person.attributes.field_ucb_person_title[0]}</p>
            <p>My department : ${person.relationships.field_ucb_person_department.data[0].id}</p>
            <p>My photo id: ${person.relationships.field_ucb_person_photo.data.id}</p>
            <p>${person.attributes.field_ucb_person_email}</p>
            <p>${person.attributes.field_ucb_person_phone}</p>
            <a href=${person.attributes.path.alias}> Go to my page </a>
        </div>
      `
      //append each completed person div to the DOM
      el.appendChild(personDiv)
    })
  })
// console.log(el.dataset.json)
