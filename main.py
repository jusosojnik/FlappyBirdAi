from pydantic import BaseModel
from fastapi import FastAPI
from model import QNetwork, QLearning
import random
from collections import deque
import numpy as np

MAX_MEMORY = 100_000
BATCH_SIZE = 100000
LR = 0.01

n_games = 0
gamma = 0.9
memory = deque(maxlen=MAX_MEMORY)  # popleft()
model = QNetwork(2, 4)
epsilon = 0.1
# trained_model = QNetwork(3, 1, 5)
# trained_model.load_state_dict(torch.load("model/trained_model.pth"))
trainer = QLearning(model, lr=LR, gamma=gamma)

total_score = 0
record = 0

state_old = None
final_move = None


def remember(state, action, reward, next_state, done):
    memory.append((state, action, reward, next_state, done))


def train_long_memory():
    if len(memory) > BATCH_SIZE:
        mini_sample = random.sample(memory, BATCH_SIZE)  # list of tuples
    else:
        mini_sample = memory

    for state, action, reward, next_state, done in mini_sample:
        trainer.update(state, action, reward, next_state, done)


def train_short_memory(state, action, reward, next_state, done):
    trainer.update(state, action, reward, next_state, done)


def get_action(state):
    return trainer.select_action(state, epsilon)


class FlappyDisk(BaseModel):
    reward: int
    score: int
    state: list
    done: bool


app = FastAPI()


@app.post("/play")
async def create_item(data: FlappyDisk):
    global state_old, final_move

    state_old = np.array(data.state)
    final_move = get_action(state_old)

    return {"move": final_move}


@app.post("/make_move")
async def create_item(data: FlappyDisk):
    global state_old, final_move

    state_old = np.array(data.state)
    final_move = trainer.select_action(state_old, epsilon)

    return {"move": final_move}


@app.post("/train")
async def create_item(data: FlappyDisk):
    global n_games, record, total_score, epsilon

    state_new = np.array(data.state)

    train_short_memory(state_old, final_move, data.reward, state_new, data.done)
    remember(state_old, final_move, data.reward, state_new, data.done)

    if data.done:
        train_long_memory()
        epsilon *= 0.9
        if data.score > record:
            record = data.score
            model.save()

    return
