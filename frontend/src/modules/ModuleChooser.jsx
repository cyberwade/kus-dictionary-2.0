import React from 'react'
import './ModuleChooser.css'

export function ModuleChooser({ onSelect }) {
  return (
    <div className="module-chooser">
      <h1 className="module-chooser-title">Kus Dictionary 2.0</h1>
      <p className="module-chooser-subtitle">Выберите модуль</p>
      <div className="module-chooser-buttons">
        <button
          type="button"
          className="module-chooser-btn module-chooser-btn-expressions"
          onClick={() => onSelect('expressions')}
        >
          Выражения
        </button>
        <button
          type="button"
          className="module-chooser-btn module-chooser-btn-historias"
          onClick={() => onSelect('historias')}
        >
          Банк историй
        </button>
      </div>
    </div>
  )
}
