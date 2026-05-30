import { useEffect, useState } from 'react'

import * as s from './CatSprite.css'

const FRAME_COUNT = 8
const FRAME_MS = 100

function frameSrc(frame: number): string {
  return `./sprites/cat-f0${frame}.png`
}

export function CatSprite(): JSX.Element {
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((f) => (f % FRAME_COUNT) + 1)
    }, FRAME_MS)
    return () => clearInterval(id)
  }, [])

  return <img className={s.sprite} src={frameSrc(frame)} alt="termcat" />
}
