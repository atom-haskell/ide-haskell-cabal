{SelectListView} = require 'atom-space-pen-views'

module.exports=
class BuilderListView extends SelectListView
  initialize: ({@onConfirmed, items, heading}) ->
    super
    @panel = atom.workspace.addModalPanel
      item: this
      visible: false
    @addClass 'ide-haskell'
    @show items
    if heading?
      div = document.createElement('div')
      div.classList.add 'select-list-heading'
      div.innerText = heading
      @prepend div

  cancelled: ->
    @panel.destroy()

  getFilterKey: ->
    "name"

  show: (list) ->
    @setItems list
    @panel.show()
    @storeFocusedElement()
    @focusFilterEditor()

  viewForItem: (builder) ->
    "<li>
      <div class='name'>#{builder.name}</div>
    </li>
    "

  confirmed: (builder) ->
    @onConfirmed? builder.name
    @cancel()
