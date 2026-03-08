import React, { useState } from 'react'
import { ModuleChooser } from './modules/ModuleChooser'
import { ExpressionsModule } from './modules/expressions/ExpressionsModule'
import { HistoriasModule } from './modules/historias/HistoriasModule'
import './App.css'

export default function App() {
  const [module, setModule] = useState(null)

  if (module === null) {
    return <ModuleChooser onSelect={setModule} />
  }

  if (module === 'historias') {
    return (
      <HistoriasModule onSwitchModule={() => setModule(null)} />
    )
  }

  return (
    <ExpressionsModule onSwitchModule={() => setModule(null)} />
  )
}
