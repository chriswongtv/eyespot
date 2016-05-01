import cv2
import numpy as np
import itertools
import urllib
from SimpleCV import *


#load images
img = cv2.imread("signimg.png")
template = cv2.imread("signtemplate.png")

#find keypoints
detector = cv2.FeatureDetector_create("SIFT")
descriptor = cv2.DescriptorExtractor_create("SIFT")

skp = detector.detect(img)#list of all the keypoints found on the image
skp, sd = descriptor.compute(img, skp)#sd is the descriptor for the image

tkp = detector.detect(template)
tkp, td = descriptor.compute(template, tkp)

flann_params = dict(algorithm=1, trees=4)
flann = cv2.flann_Index(sd, flann_params)
idx, dist = flann.knnSearch(td, 1, params={})
del flann

dist = dist[:,0]/2500.0
dist = dist.reshape(-1,).tolist()
idx = idx.reshape(-1).tolist()
indices = range(len(dist))
indices.sort(key=lambda i: dist[i])
dist = [dist[i] for i in indices]
idx = [idx[i] for i in indices]

skp_final = []
tkp_final = []
for i, dis in itertools.izip(idx, dist):
    if dis < dist:
        skp_final.append(skp[i])
    else:
        break

#draw keypoints
h1, w1 = img.shape[:2]
h2, w2 = template.shape[:2]
nWidth = w1+w2
nHeight = max(h1, h2)
hdif = (h1-h2)/2
newimg = np.zeros((nHeight, nWidth, 3), np.uint8)
newimg[hdif:hdif+h2, :w2] = template
newimg[:h1, w2:w1+w2] = img


#draw lines joining matched points.
tkp = tkp_final
skp = skp_final
for i in range(min(len(tkp), len(skp))):
    pt_a = (int(tkp[i].pt[0]), int(tkp[i].pt[1]+hdif))
    pt_b = (int(skp[i].pt[0]+w2), int(skp[i].pt[1]))
    cv2.line(newimg, pt_a, pt_b, (255, 0, 0))

i1=Image("signimg.png")
i=Image("signtemplate.png")
i.drawSIFTKeyPointMatch(i1,distance=50).show()



#use png
#reduce size
#'deprecated carbon component manager for hosting audio units.