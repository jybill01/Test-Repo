#!/bin/bash
# Proto 컴파일 스크립트 (Linux/Mac)
# Usage: ./compile_proto.sh

echo "Compiling proto file..."

python -m grpc_tools.protoc \
  -I./proto \
  --python_out=./app/grpc_generated \
  --grpc_python_out=./app/grpc_generated \
  ./proto/chat_service.proto

if [ $? -eq 0 ]; then
    echo "Proto compilation successful!"
    echo "Generated files:"
    ls -1 ./app/grpc_generated/*.py | sed 's/^/  - /'
else
    echo "Proto compilation failed!"
    exit 1
fi
