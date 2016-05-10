{SelectListView} = require 'atom-space-pen-views'

module.exports=
class BuilderListView extends SelectListView
  initialize: ({@onConfirmed, items}) ->
    super
    @panel = atom.workspace.addModalPanel
      item: this
      visible: false
    @addClass 'ide-haskell'
    @show items

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
