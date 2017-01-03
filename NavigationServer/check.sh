#!/bin/bash

echo "###"
echo "If the only process is 'grep meteor', meteor is offline"
echo "###"

ps aux | grep meteor
