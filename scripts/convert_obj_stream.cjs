const fs = require('fs');
const readline = require('readline');

async function convertObjToGlb(inputPath, outputPath) {
    console.log(`Starting conversion from ${inputPath} to ${outputPath}...`);
    
    // Pass 1: Count vertices and faces to preallocate typed arrays
    let numVertices = 0;
    let numFaces = 0;
    
    const rl1 = readline.createInterface({
        input: fs.createReadStream(inputPath),
        crlfDelay: Infinity
    });
    
    console.log("Pass 1: Counting elements...");
    for await (const line of rl1) {
        if (line.startsWith('v ')) numVertices++;
        else if (line.startsWith('f ')) numFaces++;
    }
    
    console.log(`Found ${numVertices} vertices and ${numFaces} faces.`);
    
    // Allocate TypedArrays
    const positions = new Float32Array(numVertices * 3);
    const colors = new Float32Array(numVertices * 3);
    const indices = new Uint32Array(numFaces * 3);
    
    let vIdx = 0;
    let iIdx = 0;
    
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    // Pass 2: Read data
    const rl2 = readline.createInterface({
        input: fs.createReadStream(inputPath),
        crlfDelay: Infinity
    });
    
    console.log("Pass 2: Reading data...");
    let lineNum = 0;
    for await (const line of rl2) {
        lineNum++;
        if (lineNum % 1000000 === 0) console.log(`Processed ${lineNum} lines...`);
        
        if (line.startsWith('v ')) {
            const parts = line.trim().split(/\s+/);
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);
            
            positions[vIdx * 3] = x;
            positions[vIdx * 3 + 1] = y;
            positions[vIdx * 3 + 2] = z;
            
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
            
            // Handle colors (r, g, b)
            let r = 1.0, g = 1.0, b = 1.0;
            if (parts.length >= 7) {
                r = parseFloat(parts[4]);
                g = parseFloat(parts[5]);
                b = parseFloat(parts[6]);
            }
            colors[vIdx * 3] = r;
            colors[vIdx * 3 + 1] = g;
            colors[vIdx * 3 + 2] = b;
            
            vIdx++;
        } else if (line.startsWith('f ')) {
            const parts = line.trim().split(/\s+/);
            // parts[1..3] are like "v/vt/vn" or just "v"
            // OBJ is 1-indexed, we want 0-indexed
            const v1 = parseInt(parts[1].split('/')[0]) - 1;
            const v2 = parseInt(parts[2].split('/')[0]) - 1;
            const v3 = parseInt(parts[3].split('/')[0]) - 1;
            
            indices[iIdx * 3] = v1;
            indices[iIdx * 3 + 1] = v2;
            indices[iIdx * 3 + 2] = v3;
            
            iIdx++;
            
            // If it's a quad, triangulate on the fly (basic implementation, usually not needed if already triangulated)
            if (parts.length > 4) {
                 const v4 = parseInt(parts[4].split('/')[0]) - 1;
                 indices[iIdx * 3] = v1;
                 indices[iIdx * 3 + 1] = v3;
                 indices[iIdx * 3 + 2] = v4;
                 iIdx++;
            }
        }
    }
    
    // Correct actual index length in case of quads
    const finalIndices = new Uint32Array(indices.buffer, 0, iIdx * 3);
    
    // Now create GLTF JSON and BIN
    console.log("Creating GLTF structure...");
    
    const posBufferLength = positions.byteLength;
    const colBufferLength = colors.byteLength;
    const indBufferLength = finalIndices.byteLength;
    
    // Align buffers to 4 bytes
    const totalBinLength = posBufferLength + colBufferLength + indBufferLength;
    const binBuffer = Buffer.alloc(totalBinLength);
    
    let offset = 0;
    
    Buffer.from(positions.buffer).copy(binBuffer, offset);
    const posOffset = offset;
    offset += posBufferLength;
    
    Buffer.from(colors.buffer).copy(binBuffer, offset);
    const colOffset = offset;
    offset += colBufferLength;
    
    Buffer.from(finalIndices.buffer).copy(binBuffer, offset);
    const indOffset = offset;
    offset += indBufferLength;
    
    const gltf = {
        asset: { version: "2.0", generator: "Custom OBJ to GLB Node Script" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{
            primitives: [{
                attributes: {
                    POSITION: 0,
                    COLOR_0: 1
                },
                indices: 2,
                material: 0
            }]
        }],
        materials: [{
            pbrMetallicRoughness: {
                metallicFactor: 0.0,
                roughnessFactor: 0.8
            }
        }],
        buffers: [{
            byteLength: binBuffer.byteLength
        }],
        bufferViews: [
            { buffer: 0, byteOffset: posOffset, byteLength: posBufferLength, target: 34922 }, // ARRAY_BUFFER
            { buffer: 0, byteOffset: colOffset, byteLength: colBufferLength, target: 34922 }, // ARRAY_BUFFER
            { buffer: 0, byteOffset: indOffset, byteLength: indBufferLength, target: 34963 }  // ELEMENT_ARRAY_BUFFER
        ],
        accessors: [
            {
                bufferView: 0,
                byteOffset: 0,
                componentType: 5126, // FLOAT
                count: numVertices,
                type: "VEC3",
                max: [maxX, maxY, maxZ],
                min: [minX, minY, minZ]
            },
            {
                bufferView: 1,
                byteOffset: 0,
                componentType: 5126, // FLOAT
                count: numVertices,
                type: "VEC3"
            },
            {
                bufferView: 2,
                byteOffset: 0,
                componentType: 5125, // UNSIGNED_INT
                count: finalIndices.length,
                type: "SCALAR"
            }
        ]
    };
    
    const jsonString = JSON.stringify(gltf);
    // Align JSON string length to 4 bytes with spaces
    let jsonBuffer = Buffer.from(jsonString, 'utf8');
    const padding = (4 - (jsonBuffer.length % 4)) % 4;
    if (padding > 0) {
        jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]); // 0x20 is space
    }
    
    // GLB Header (12 bytes)
    // magic: 0x46546C67 ("glTF")
    // version: 2
    // length: 12 + 8 + jsonBuffer.length + 8 + binBuffer.byteLength
    const glbHeader = Buffer.alloc(12);
    glbHeader.writeUInt32LE(0x46546C67, 0);
    glbHeader.writeUInt32LE(2, 4);
    
    // Align BIN buffer length to 4 bytes with 0s (already aligned because Float32/Uint32 are 4 bytes)
    
    const length = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;
    glbHeader.writeUInt32LE(length, 8);
    
    // JSON Chunk Header (8 bytes)
    // chunkLength: jsonBuffer.length
    // chunkType: 0x4E4F534A ("JSON")
    const jsonChunkHeader = Buffer.alloc(8);
    jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
    jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4);
    
    // BIN Chunk Header (8 bytes)
    // chunkLength: binBuffer.length
    // chunkType: 0x004E4942 ("BIN\0")
    const binChunkHeader = Buffer.alloc(8);
    binChunkHeader.writeUInt32LE(binBuffer.length, 0);
    binChunkHeader.writeUInt32LE(0x004E4942, 4);
    
    const fd = fs.openSync(outputPath, 'w');
    fs.writeSync(fd, glbHeader);
    fs.writeSync(fd, jsonChunkHeader);
    fs.writeSync(fd, jsonBuffer);
    fs.writeSync(fd, binChunkHeader);
    fs.writeSync(fd, binBuffer);
    fs.closeSync(fd);
    
    console.log('Done writing GLB!');
}

const objPath = 'D:\\Aeternum Modelos 3D\\2. corte sagital del encefalo humano modelo 3d\\source\\model\\model.obj';
const glbPath = 'public/models/native/cranial-encephalon-sagittal-section-color.glb';

convertObjToGlb(objPath, glbPath).catch(console.error);
