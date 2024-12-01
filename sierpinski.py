import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool
from torch_geometric.data import Data, DataLoader
from torchvision import datasets, transforms
import numpy as np
from typing import Tuple, List
from time import time
from datetime import datetime
import holoviews as hv
from holoviews import opts
import panel as pn
import networkx as nx
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, ColorBar
from bokeh.transform import linear_cmap
from bokeh.palettes import Viridis256
import pandas as pd

hv.extension('bokeh')
pn.extension()

class TrainingVisualizer:
    def __init__(self):
        # Initialize data storage
        self.metrics = {
            'train_loss': [],
            'train_acc': [],
            'test_loss': [],
            'test_acc': [],
            'epochs': [],
            'depth': []
        }
        
        # Create plots
        self.loss_plot = figure(title='Loss Over Time', width=600, height=300)
        self.acc_plot = figure(title='Accuracy Over Time', width=600, height=300)
        self.graph_plot = figure(title='Sierpinski Graph Structure', width=600, height=600)
        
        # Initialize data sources
        self.loss_source = ColumnDataSource(data=dict(
            epochs=[], train_loss=[], test_loss=[]
        ))
        self.acc_source = ColumnDataSource(data=dict(
            epochs=[], train_acc=[], test_acc=[]
        ))
        self.graph_source = ColumnDataSource(data=dict(
            x=[], y=[], color=[], node_size=[]
        ))
        
        # Setup plots
        self._setup_plots()
        
        # Create layout
        self.layout = pn.Column(
            pn.Row(
                pn.pane.Bokeh(self.loss_plot),
                pn.pane.Bokeh(self.acc_plot)
            ),
            pn.pane.Bokeh(self.graph_plot)
        )
        
    def _setup_plots(self):
        # Loss plot
        self.loss_plot.line('epochs', 'train_loss', line_color='blue', 
                          legend_label='Train Loss', source=self.loss_source)
        self.loss_plot.line('epochs', 'test_loss', line_color='red',
                          legend_label='Test Loss', source=self.loss_source)
        self.loss_plot.legend.click_policy = 'hide'
        
        # Accuracy plot
        self.acc_plot.line('epochs', 'train_acc', line_color='blue',
                         legend_label='Train Accuracy', source=self.acc_source)
        self.acc_plot.line('epochs', 'test_acc', line_color='red',
                         legend_label='Test Accuracy', source=self.acc_source)
        self.acc_plot.legend.click_policy = 'hide'
        
        # Graph plot
        self.graph_plot.circle('x', 'y', size='node_size', 
                             fill_color='color', line_color=None,
                             source=self.graph_source)
        
    def update_metrics(self, epoch, depth, train_loss, train_acc, test_loss, test_acc):
        # Update metrics storage
        self.metrics['epochs'].append(epoch)
        self.metrics['depth'].append(depth)
        self.metrics['train_loss'].append(train_loss)
        self.metrics['train_acc'].append(train_acc)
        self.metrics['test_loss'].append(test_loss)
        self.metrics['test_acc'].append(test_acc)
        
        # Update plot sources
        self.loss_source.data = {
            'epochs': self.metrics['epochs'],
            'train_loss': self.metrics['train_loss'],
            'test_loss': self.metrics['test_loss']
        }
        
        self.acc_source.data = {
            'epochs': self.metrics['epochs'],
            'train_acc': self.metrics['train_acc'],
            'test_acc': self.metrics['test_acc']
        }
        
    def update_graph(self, edge_index: torch.Tensor, node_values: torch.Tensor = None):
        # Convert to networkx graph for layout
        G = nx.Graph()
        edges = edge_index.t().cpu().numpy()
        G.add_edges_from(edges)
        
        # Get spring layout
        pos = nx.spring_layout(G)
        
        # Prepare node colors based on values or depth
        if node_values is not None:
            colors = node_values.cpu().numpy()
        else:
            colors = np.ones(len(G.nodes()))
            
        # Update graph source
        self.graph_source.data = {
            'x': [pos[node][0] for node in G.nodes()],
            'y': [pos[node][1] for node in G.nodes()],
            'color': colors,
            'node_size': [10 for _ in G.nodes()]
        }

class AdaptiveDepthTrainer:
    def __init__(self, 
                 device: torch.device,
                 min_accuracy: float = 0.90,
                 max_depth: int = 5,
                 patience: int = 2,
                 epochs_per_depth: int = 5):
        self.device = device
        self.min_accuracy = min_accuracy
        self.max_depth = max_depth
        self.patience = patience
        self.epochs_per_depth = epochs_per_depth
        self.training_start_time = None
        self.depth_start_time = None
        self.epoch_start_time = None
        self.visualizer = TrainingVisualizer()
        
    # ... [Previous methods remain the same until train_epoch]
    
    def train_epoch(self, model: nn.Module, loader: DataLoader, optimizer: torch.optim.Optimizer, 
                   epoch: int, depth: int) -> float:
        model.train()
        total_loss = 0
        batches = len(loader)
        correct = 0
        total = 0
        
        for batch_idx, data in enumerate(loader):
            data = data.to(self.device)
            optimizer.zero_grad()
            output = model(data.x, data.edge_index, data.batch)
            loss = F.nll_loss(output, data.y)
            loss.backward()
            optimizer.step()
            
            # Calculate accuracy for this batch
            pred = output.max(1)[1]
            correct += pred.eq(data.y).sum().item()
            total += data.y.size(0)
            
            total_loss += loss.item()
            
            if (batch_idx + 1) % 100 == 0:
                print(f"    Batch {batch_idx + 1}/{batches}: "
                      f"Loss: {loss.item():.4f}, "
                      f"Running Acc: {100. * correct/total:.2f}%")
                
                # Update visualization with intermediate results
                self.visualizer.update_metrics(
                    epoch=epoch,
                    depth=depth,
                    train_loss=loss.item(),
                    train_acc=correct/total,
                    test_loss=loss.item(),  # Using training loss as placeholder
                    test_acc=correct/total   # Using training acc as placeholder
                )
                
                # Get node embeddings for visualization
                with torch.no_grad():
                    node_embeddings = model.conv1(data.x, data.edge_index)
                    node_values = torch.mean(node_embeddings, dim=1)
                    self.visualizer.update_graph(data.edge_index, node_values)
            
        return total_loss / len(loader), correct / total

    def train_with_adaptive_depth(self) -> Tuple[nn.Module, int]:
        # Start visualization server
        self.visualizer.layout.show()
        
        # ... [Rest of the method remains the same, but pass epoch and depth to train_epoch]
        
def main():
    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Initialize trainer with desired parameters
    trainer = AdaptiveDepthTrainer(
        device=device,
        min_accuracy=0.90,
        max_depth=5,
        patience=2,
        epochs_per_depth=5
    )
    
    # Train model with adaptive depth
    best_model, best_depth = trainer.train_with_adaptive_depth()
    
if __name__ == "__main__":
    main()