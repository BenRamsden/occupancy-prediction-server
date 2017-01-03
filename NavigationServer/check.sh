#!/bin/bash

echo "###"
echo "If the only process is 'grep node' and 'grep npm', server is offline"
echo "###"

ps aux | grep node
ps aux | grep npm
