import AVFoundation
import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers

func die(_ m: String) -> Never { FileHandle.standardError.write((m + "\n").data(using: .utf8)!); exit(1) }
let a = CommandLine.arguments
guard a.count >= 3 else { die("usage: info|frames|encode ...") }
let asset = AVURLAsset(url: URL(fileURLWithPath: a[2]))
guard let track = asset.tracks(withMediaType: .video).first else { die("no video track") }

switch a[1] {
case "info":
  let s = track.naturalSize
  print("size \(Int(s.width))x\(Int(s.height)) fps \(track.nominalFrameRate) duration \(CMTimeGetSeconds(asset.duration)) bitrate \(Int(track.estimatedDataRate)) audioTracks \(asset.tracks(withMediaType: .audio).count)")
case "frames":
  // frames <in> <outdir> <t,t,t> [maxWidth]
  let gen = AVAssetImageGenerator(asset: asset)
  gen.appliesPreferredTrackTransform = true
  gen.requestedTimeToleranceBefore = .zero
  gen.requestedTimeToleranceAfter = .zero
  if a.count > 5, let w = Double(a[5]) { gen.maximumSize = CGSize(width: w, height: w) }
  for t in a[4].split(separator: ",") {
    let time = CMTime(seconds: Double(t)!, preferredTimescale: 600)
    var actual = CMTime.zero
    guard let img = try? gen.copyCGImage(at: time, actualTime: &actual) else { die("no frame at \(t)") }
    let url = URL(fileURLWithPath: a[3]).appendingPathComponent("f-\(t).png")
    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
    print("\(t) -> actual \(CMTimeGetSeconds(actual)) \(img.width)x\(img.height)")
  }
case "encode":
  // encode <in> <out> <start> <duration> <w> <h> <bitrate>
  let out = URL(fileURLWithPath: a[3])
  try? FileManager.default.removeItem(at: out)
  let start = CMTime(seconds: Double(a[4])!, preferredTimescale: 600)
  let dur = CMTime(seconds: Double(a[5])!, preferredTimescale: 600)
  let w = Int(a[6])!, h = Int(a[7])!, rate = Int(a[8])!
  let reader = try! AVAssetReader(asset: asset)
  reader.timeRange = CMTimeRange(start: start, duration: dur)
  let ro = AVAssetReaderTrackOutput(track: track, outputSettings: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
    kCVPixelBufferWidthKey as String: w, kCVPixelBufferHeightKey as String: h,
  ])
  ro.alwaysCopiesSampleData = false
  reader.add(ro)
  let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
  writer.shouldOptimizeForNetworkUse = true
  let wi = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: h,
    AVVideoCompressionPropertiesKey: [
      AVVideoAverageBitRateKey: rate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      AVVideoMaxKeyFrameIntervalKey: 60, AVVideoAllowFrameReorderingKey: true,
      AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC,
    ] as [String: Any],
  ])
  wi.expectsMediaDataInRealTime = false
  writer.add(wi)
  guard reader.startReading() else { die("reader: \(String(describing: reader.error))") }
  guard writer.startWriting() else { die("writer: \(String(describing: writer.error))") }
  writer.startSession(atSourceTime: start)
  var n = 0
  while true {
    if wi.isReadyForMoreMediaData {
      if let sb = ro.copyNextSampleBuffer() { if !wi.append(sb) { die("append: \(String(describing: writer.error))") }; n += 1 } else { break }
    } else { usleep(2000) }
  }
  wi.markAsFinished()
  let sem = DispatchSemaphore(value: 0)
  writer.finishWriting { sem.signal() }
  sem.wait()
  if writer.status != .completed { die("finish: \(String(describing: writer.error))") }
  let size = (try! FileManager.default.attributesOfItem(atPath: out.path)[.size] as! NSNumber).intValue
  print("frames \(n) bytes \(size) -> \(out.lastPathComponent)")
default: die("unknown")
}
