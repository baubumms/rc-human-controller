import type { NextPage } from 'next'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleUpIcon,
  FireIcon,
} from '@heroicons/react/solid'
import cn from 'classnames'
import { toast } from 'react-toastify'

const SOCKET_SHARED_SECRET = process.env.NEXT_PUBLIC_SOCKET_SHARED_SECRET
if (SOCKET_SHARED_SECRET === undefined) {
  throw new Error('Env var SOCKET_SHARED_SECRET not set!')
}

type TConsoleRow = { time: string; content: string }

const Console = (props: { onSubmit: (command: string) => void }) => {
  const [history, setHistory] = useState<TConsoleRow[]>([])

  return (
    <div className="flex h-96 flex-col border-2 border-white">
      <div className="flex-grow">
        {history.map((row) => {
          return (
            <div className="flex items-start justify-start">
              <div>{row.time}</div>
              <div className="flex-grow">{row.content}</div>
            </div>
          )
        })}
      </div>
      <div className="flex border-t-2 border-white">
        <input className="flex-grow bg-gray-900" />
        <Button>
          <ArrowRightIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

const Button = (props: {
  onClick?: () => void
  children: ReactNode
  className?: string
}) => {
  const onClick = () => {
    if (props.onClick !== undefined) {
      props.onClick()
    }
  }

  return (
    <div
      className={cn(
        'cursor-pointer rounded-full p-2 text-white  shadow-xl hover:shadow-inner',
        props.className
      )}
      onClick={onClick}
    >
      {props.children}
    </div>
  )
}

enum DIRECTION {
  Forward,
  Backward,
  Left,
  Right,
}

const Home: NextPage = () => {
  const [socket, setSocket] = useState<WebSocket>()
  const [headAngle, setHeadAngle] = useState(1000)

  const send = useCallback(
    (payload: {}) => {
      if (socket === undefined || socket.readyState !== 1) {
        toast.error('WebSocket not available!')
        console.error(socket)
        return
      }

      const strPayload = JSON.stringify(payload)
      socket.send(strPayload)
      console.log('Sent: ', strPayload)
    },
    [socket]
  )

  const moveHead = useCallback(
    (offset: number) => {
      let newAngle = (headAngle + offset) % 2000
      if (newAngle < 0) {
        newAngle = 0
      }

      setHeadAngle(newAngle)
      send({ h: true, a: newAngle })
    },
    [headAngle]
  )

  const drive = (direction: DIRECTION) => {
    const payload: Record<string, number | boolean> = {
      w: true,
      e: 5000,
    }
    switch (direction) {
      case DIRECTION.Forward:
        payload['s'] = 500
        payload['d'] = 0
        payload['t'] = 400
        break

      case DIRECTION.Backward:
        payload['s'] = -500
        payload['d'] = 0
        payload['t'] = 400

        break

      case DIRECTION.Left:
        payload['s'] = 50
        payload['d'] = -1000
        payload['t'] = 100

        break

      case DIRECTION.Right:
        payload['s'] = 50
        payload['d'] = 1000
        payload['t'] = 100

        break
    }

    send(payload)
  }

  const fire = () => send({ f: true, e: 1300, l: -1 })

  useEffect(() => {
    if (window !== undefined) {
      const ws = new WebSocket('ws://vps.leolurch.de:8081')
      ws.addEventListener('open', function (event) {
        ws.send(SOCKET_SHARED_SECRET)
      })

      ws.addEventListener('message', function (event) {
        console.log('Message from server ', event.data)
      })

      setSocket(ws)
    }
  }, [])

  useEffect(() => {
    let keyDown = false

    const keydown = (e: KeyboardEvent) => {
      if (keyDown) {
        return
      }

      console.log('down')
      keyDown = true

      switch (e.key) {
        case 'w':
          drive(DIRECTION.Forward)
          break
        case 's':
          drive(DIRECTION.Backward)
          break
        case 'a':
          drive(DIRECTION.Left)
          break
        case 'd':
          drive(DIRECTION.Right)
          break
        case 'f':
          fire()
          break
        case 't':
          moveHead(20)
          break
        case 'g':
          moveHead(-20)
      }
    }
    const keyup = (e: KeyboardEvent) => {
      console.log('up')
      keyDown = false
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('keyup', keyup)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
    }
  }, [socket])

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <h1>RC Human Controller</h1>

      <div className="grid h-36 w-36 grid-cols-3 grid-rows-3">
        <Button onClick={() => moveHead(20)}>
          <ArrowUpIcon />
        </Button>
        <Button
          className="col-start-1 row-start-3"
          onClick={() => moveHead(-20)}
        >
          <ArrowDownIcon />
        </Button>
        <Button className="col-start-2 row-start-2" onClick={fire}>
          <FireIcon />
        </Button>

        <Button
          className="col-start-2 row-start-1"
          onClick={() => drive(DIRECTION.Forward)}
        >
          <ChevronDoubleUpIcon />
        </Button>
        <Button
          className="col-start-1 row-start-2"
          onClick={() => drive(DIRECTION.Left)}
        >
          <ChevronDoubleLeftIcon />
        </Button>
        <Button
          className="col-start-3 row-start-2"
          onClick={() => drive(DIRECTION.Right)}
        >
          <ChevronDoubleRightIcon />
        </Button>
        <Button
          className="col-start-2 row-start-3"
          onClick={() => drive(DIRECTION.Backward)}
        >
          <ChevronDoubleDownIcon />
        </Button>
      </div>
    </div>
  )
}

export default Home
