const url = '/data/state/'
jQuery.fx.off = true
let state_dropdown = $('#state')
state_dropdown.empty()
state_dropdown.append('<option selected value disabled>Choose State</option>')

$.getJSON(url, function (data) {
  $.each(data, function (key, entry) {
    state_dropdown.append(
      $('<option></option>')
        .attr('value', entry)
        .text(entry)
    )
  })
  if (state !== '') {
    state_dropdown.val(state)
    updateCounty()
  }
})

let county_dropdown = $('#county')
county_dropdown.empty()
county_dropdown.append('<option selected value disabled>--</option>')
county_dropdown.prop('selectedIndex', 0)

function updateCounty () {
  county_dropdown.empty()
  county_dropdown.append(
    '<option selected value disabled>Choose County</option>'
  )
  entries = []
  $.getJSON(url + state_dropdown.val(), function (data) {
    $.each(data, function (key, entry) {
      county_dropdown.append(
        $('<option></option>')
          .attr('value', entry)
          .text(entry)
      )
      entries += entry
    })
    if (entries.includes(county)) {
        county_dropdown.val(county)
    } else { 
      county_dropdown.prop('selectedIndex', 0)
    }
  })
}
