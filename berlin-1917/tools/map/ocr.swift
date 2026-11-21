// ocr IMAGE [MINH]: the text Apple Vision reads in an image (on this Mac, no network), one line each: text \t confidence \t x0 y0 x1 y1 in pixels from the top left. spots.ts compiles it to cache/bin/ocr.
import Foundation
import Vision
import AppKit
let args = CommandLine.arguments
guard args.count > 1, let img = NSImage(contentsOfFile: args[1]), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { FileHandle.standardError.write("cannot read image\n".data(using: .utf8)!); exit(1) }
let W = Double(cg.width), H = Double(cg.height)
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
req.recognitionLanguages = ["de-DE"]
if args.count > 2, let m = Float(args[2]) { req.minimumTextHeight = m }
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
for o in req.results ?? [] {
  guard let c = o.topCandidates(1).first else { continue }
  let b = o.boundingBox
  print(String(format: "%@\t%.2f\t%.0f %.0f %.0f %.0f", c.string, c.confidence, b.minX * W, (1 - b.maxY) * H, b.maxX * W, (1 - b.minY) * H))
}
