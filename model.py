import torch
import torch.nn as nn
import numpy as np
import os


class QNetwork(nn.Module):
    def __init__(self, state_size, hidden_size):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(state_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, 1)

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

    def save(self, file_name='model1.pth'):
        model_folder_path = './model'
        if not os.path.exists(model_folder_path):
            os.makedirs(model_folder_path)

        file_name = os.path.join(model_folder_path, file_name)
        torch.save(self.state_dict(), file_name)


class QLearning:
    def __init__(self, q_net, gamma=0.99, lr=0.001):
        self.q_net = q_net
        self.gamma = gamma
        self.optimizer = torch.optim.Adam(self.q_net.parameters(), lr=lr)
        self.criterion = nn.MSELoss()

    def select_action(self, state, epsilon=0.1):
        if np.random.uniform() < epsilon:
            return np.random.randint(self.q_net.fc3.out_features + 1)
        else:
            state = torch.FloatTensor(state).unsqueeze(0)
            q_values = torch.sigmoid(self.q_net(state).max())
            action = 1 if q_values >= 0.5 else 0

            return action

    def update(self, state, action, reward, next_state, done):
        if action == 0 and reward < 0:
            reward = -reward
        elif action == 0 and reward >= 0:
            reward = -reward
        # print("Update", state, action, reward, next_state, done)
        state = torch.FloatTensor(state)
        next_state = torch.FloatTensor(next_state)
        q_value = self.q_net(state)[0]
        next_q_value = 0 if done else self.q_net(next_state).max()
        target_q_value = torch.tensor((reward + self.gamma * next_q_value))
        # print(q_value, next_q_value, target_q_value)
        # print(torch.sigmoid(q_value), torch.sigmoid(torch.tensor(next_q_value)), torch.sigmoid(target_q_value))
        loss = self.criterion(q_value, target_q_value)

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        # input()
